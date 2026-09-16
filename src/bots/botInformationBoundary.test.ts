import { describe, it, expect } from 'vitest';
import { HandEngine, PlayerSetup } from '../engine/engine';
import { getTotalPot } from '../engine/engine';
import { buildObservation, decideBotAction } from './botDecision';
import { cardToString } from '../engine/cards';
import { mulberry32 } from '../engine/rng';
import { computeLegalActionsForPlayer } from '../engine/legalActions';

function makePlayers(n: number): PlayerSetup[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    name: `Bot ${i}`,
    isHuman: false,
    personality: 'balanced-advanced' as const,
  }));
}

describe('bot information boundary', () => {
  it('never exposes other players hole cards inside a BotObservation', () => {
    const engine = new HandEngine({ smallBlind: 5, bigBlind: 10, startingStack: 1000 }, makePlayers(6), 77);
    engine.startHand();
    const state = engine.getState();
    const rng = mulberry32(1);

    // Structural check (robust against incidental substring collisions in
    // JSON key names, e.g. "committedThisStreet" containing "Th"): the only
    // two card-array fields on a BotObservation are holeCards and
    // community, so it is enough to verify those two arrays contain exactly
    // the bot's own hole cards and the shared board — nothing belonging to
    // any other player.
    for (const player of state.players) {
      if (!player.isActive) continue;
      const obs = buildObservation(state, player, getTotalPot(state), rng);

      expect(obs.holeCards.map(cardToString).sort()).toEqual(player.holeCards.map(cardToString).sort());
      expect(obs.community.map(cardToString).sort()).toEqual(state.community.map(cardToString).sort());

      const cardArrayFields = Object.entries(obs).filter(
        ([key, value]) =>
          Array.isArray(value) && (key === 'holeCards' || key === 'community' || (value.length > 0 && 'rank' in (value[0] as object)))
      );
      expect(cardArrayFields.map(([key]) => key).sort()).toEqual(['community', 'holeCards']);
    }
  });

  it('does not expose undealt future community cards', () => {
    const engine = new HandEngine({ smallBlind: 5, bigBlind: 10, startingStack: 1000 }, makePlayers(4), 88);
    engine.startHand(); // preflop: community should be empty
    const state = engine.getState();
    expect(state.community).toHaveLength(0);
    const rng = mulberry32(2);
    const player = state.players.find((p) => p.seat === state.actingSeat)!;
    const obs = buildObservation(state, player, getTotalPot(state), rng);
    expect(obs.community).toHaveLength(0);
  });

  it('the BotObservation type structurally cannot carry other players hole cards or full table state', () => {
    const engine = new HandEngine({ smallBlind: 5, bigBlind: 10, startingStack: 1000 }, makePlayers(3), 5);
    engine.startHand();
    const state = engine.getState();
    const rng = mulberry32(3);
    const player = state.players.find((p) => p.seat === state.actingSeat)!;
    const obs = buildObservation(state, player, getTotalPot(state), rng);
    // Only known keys should exist — no "players" or "opponents" field leaking the full roster.
    expect(Object.keys(obs).sort()).toEqual(
      [
        'seat',
        'holeCards',
        'community',
        'pot',
        'currentBet',
        'committedThisStreet',
        'stack',
        'street',
        'numActiveOpponents',
        'legal',
        'personality',
        'rng',
      ].sort()
    );
  });

  it('bots always choose a legal action given only their observation', { timeout: 20000 }, () => {
    const engine = new HandEngine({ smallBlind: 5, bigBlind: 10, startingStack: 1000 }, makePlayers(5), 33);
    const rng = mulberry32(4);
    for (let hand = 0; hand < 20; hand++) {
      if (engine.getState().players.filter((p) => p.isActive).length < 2) break;
      engine.startHand();
      let guard = 0;
      while (!engine.getState().isHandComplete) {
        guard++;
        if (guard > 200) throw new Error('infinite loop suspected');
        const state = engine.getState();
        const player = state.players.find((p) => p.seat === state.actingSeat)!;
        const obs = buildObservation(state, player, getTotalPot(state), rng);
        const action = decideBotAction(obs);
        const legal = computeLegalActionsForPlayer(state, player);
        if (action.type === 'fold') expect(legal.canFold).toBe(true);
        if (action.type === 'check') expect(legal.canCheck).toBe(true);
        if (action.type === 'call') expect(legal.canCall).toBe(true);
        if (action.type === 'bet' || action.type === 'raise') {
          expect(legal.canBetOrRaise).toBe(true);
          expect(action.amount).toBeGreaterThanOrEqual(legal.minRaiseTo);
          expect(action.amount).toBeLessThanOrEqual(legal.maxRaiseTo);
        }
        engine.applyAction(player.id, action);
      }
    }
  });
});
