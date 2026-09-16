import { describe, it, expect } from 'vitest';
import { HandEngine, PlayerSetup } from './engine';
import { computeLegalActionsForPlayer } from './legalActions';
import { mulberry32 } from './rng';
import { cardToString } from './cards';

function makePlayers(n: number): PlayerSetup[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `Player ${i}`, isHuman: false }));
}

/** Picks a pseudo-random but legal action to drive the simulation deterministically. */
function pickAction(rand: () => number, legal: ReturnType<typeof computeLegalActionsForPlayer>) {
  const r = rand();
  // Modest raise frequency and modest sizing so sessions last many hands
  // instead of everyone shoving all-in immediately; occasional shoves still
  // occur naturally when raiseIsAllInOnly is forced by a short stack.
  if (legal.canBetOrRaise && r < 0.08) {
    if (legal.raiseIsAllInOnly) return { type: 'all-in' as const };
    const span = Math.max(1, Math.min(legal.maxRaiseTo - legal.minRaiseTo, legal.minRaiseTo));
    const amount = Math.min(legal.maxRaiseTo, legal.minRaiseTo + Math.floor(rand() * span * 0.5));
    return { type: 'raise' as const, amount };
  }
  if (legal.canCheck) return { type: 'check' as const };
  if (legal.canCall && r < 0.75) return { type: 'call' as const };
  if (legal.canFold) return { type: 'fold' as const };
  if (legal.canCall) return { type: 'call' as const };
  throw new Error('No legal action available — engine bug');
}

describe('multi-hand session simulation', () => {
  it('conserves total chips and never crashes across many randomized hands (6-max)', () => {
    const players = makePlayers(6);
    const config = { smallBlind: 5, bigBlind: 10, startingStack: 1000 };
    const engine = new HandEngine(config, players, 999);
    const rand = mulberry32(555);
    const initialTotal = config.startingStack * players.length;

    let handsPlayed = 0;
    while (handsPlayed < 300) {
      const activeCount = engine.getState().players.filter((p) => p.isActive).length;
      if (activeCount < 2) break;
      engine.startHand();
      let guard = 0;
      while (!engine.getState().isHandComplete) {
        guard += 1;
        if (guard > 500) throw new Error('Hand did not terminate — possible infinite loop');
        const s = engine.getState();
        const actorSeat = s.actingSeat;
        if (actorSeat === null) throw new Error('Hand not complete but no acting seat set');
        const actor = s.players.find((p) => p.seat === actorSeat)!;
        const legal = computeLegalActionsForPlayer(s, actor);
        const action = pickAction(rand, legal);
        engine.applyAction(actor.id, action);
      }
      const finalState = engine.getState();
      const stackSum = finalState.players.reduce((sum, p) => sum + p.stack, 0);
      expect(stackSum).toBe(initialTotal);

      // Deck integrity: every dealt card (hole + community) across this hand must be unique.
      const dealtInHand = finalState.players
        .filter((p) => p.holeCards.length > 0)
        .flatMap((p) => p.holeCards)
        .concat(finalState.community);
      const asStrings = dealtInHand.map(cardToString);
      expect(new Set(asStrings).size).toBe(asStrings.length);

      handsPlayed += 1;
    }
    expect(handsPlayed).toBeGreaterThan(10);
  });
});
