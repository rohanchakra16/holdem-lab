import { describe, it, expect } from 'vitest';
import { HandEngine, getTotalPot, DevelopmentError } from './engine';
import { PlayerSetup } from './engine';
import { computeLegalActionsForPlayer } from './legalActions';

const config = { smallBlind: 1, bigBlind: 2, startingStack: 200 };

function makePlayers(n: number): PlayerSetup[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `Player ${i}`, isHuman: i === 0 }));
}

/** Total chips currently "in play" (stacks plus whatever is committed to the pot so far this hand). */
function chipsInPlay(engine: HandEngine): number {
  const s = engine.getState();
  return s.players.reduce((sum, p) => sum + p.stack + p.committedTotal, 0);
}

/** Sum of stacks alone — valid as a total-chip check only once a hand is fully resolved and paid out. */
function stackTotal(engine: HandEngine): number {
  return engine.getState().players.reduce((sum, p) => sum + p.stack, 0);
}

describe('heads-up blind and action order', () => {
  it('posts blinds correctly and gives the button/SB the first preflop action', () => {
    const engine = new HandEngine(config, makePlayers(2), 42);
    engine.startHand();
    const s = engine.getState();
    expect(s.players[0].committedThisStreet).toBe(1); // button/SB
    expect(s.players[1].committedThisStreet).toBe(2); // BB
    expect(s.currentBet).toBe(2);
    expect(s.actingSeat).toBe(0);
  });

  it('gives the big blind the option to act after a call preflop', () => {
    const engine = new HandEngine(config, makePlayers(2), 42);
    engine.startHand();
    engine.applyAction('p0', { type: 'call' });
    const s = engine.getState();
    expect(s.actingSeat).toBe(1); // BB gets the option
    expect(s.isHandComplete).toBe(false);
  });

  it('gives the non-button player first action postflop in heads-up', () => {
    const engine = new HandEngine(config, makePlayers(2), 42);
    engine.startHand();
    engine.applyAction('p0', { type: 'call' });
    engine.applyAction('p1', { type: 'check' });
    const s = engine.getState();
    expect(s.street).toBe('flop');
    expect(s.actingSeat).toBe(1); // non-button acts first postflop
  });
});

describe('multiway action order (3-handed)', () => {
  it('makes the button UTG preflop in a 3-handed game', () => {
    const engine = new HandEngine(config, makePlayers(3), 7);
    engine.startHand();
    const s = engine.getState();
    // button=0, sb=1, bb=2, first-to-act preflop = next after bb = seat 0 (button/UTG in 3-handed)
    expect(s.buttonSeat).toBe(0);
    expect(s.players[1].committedThisStreet).toBe(1);
    expect(s.players[2].committedThisStreet).toBe(2);
    expect(s.actingSeat).toBe(0);
  });

  it('moves the button forward on each new hand', () => {
    const engine = new HandEngine(config, makePlayers(3), 7);
    engine.startHand();
    // Fold everyone to end the hand quickly.
    engine.applyAction('p0', { type: 'fold' });
    engine.applyAction('p1', { type: 'fold' });
    expect(engine.getState().isHandComplete).toBe(true);
    engine.startHand();
    expect(engine.getState().buttonSeat).toBe(1);
  });
});

describe('minimum raise enforcement', () => {
  it('computes the correct minimum raise-to amount', () => {
    const engine = new HandEngine(config, makePlayers(3), 1);
    engine.startHand();
    const s = engine.getState();
    const actor = s.players.find((p) => p.seat === s.actingSeat)!;
    const legal = computeLegalActionsForPlayer(s, actor);
    expect(legal.minRaiseTo).toBe(4); // currentBet 2 + min raise increment (bigBlind) 2
  });

  it('rejects a raise smaller than the minimum', () => {
    const engine = new HandEngine(config, makePlayers(3), 1);
    engine.startHand();
    const seat = engine.getState().actingSeat!;
    const playerId = engine.getState().players.find((p) => p.seat === seat)!.id;
    expect(() => engine.applyAction(playerId, { type: 'raise', amount: 3 })).toThrow(DevelopmentError);
  });

  it('accepts a raise exactly at the minimum and updates the new minimum for the next raise', () => {
    const engine = new HandEngine(config, makePlayers(3), 1);
    engine.startHand();
    const seat = engine.getState().actingSeat!;
    const p0 = engine.getState().players.find((p) => p.seat === seat)!.id;
    engine.applyAction(p0, { type: 'raise', amount: 4 }); // raise of 2 (to 4)
    const s = engine.getState();
    expect(s.currentBet).toBe(4);
    expect(s.lastRaiseAmount).toBe(2);
    const nextActor = s.players.find((p) => p.seat === s.actingSeat)!;
    const legal = computeLegalActionsForPlayer(s, nextActor);
    expect(legal.minRaiseTo).toBe(6); // 4 + 2
  });
});

describe('short all-in raises', () => {
  it('flags a raise-is-all-in-only when the stack cannot make a full minimum raise', () => {
    const players = makePlayers(2);
    const engine = new HandEngine({ smallBlind: 1, bigBlind: 2, startingStack: 200 }, players, 5);
    engine.startHand();
    // Manually shrink the acting player's stack to simulate a short stack facing a raise.
    const s = engine.getState();
    const raiser = s.players.find((p) => p.seat === s.actingSeat)!;
    // p0 (button) raises big first
    engine.applyAction(raiser.id, { type: 'raise', amount: 100 });
    const s2 = engine.getState();
    const responder = s2.players.find((p) => p.seat === s2.actingSeat)!;
    // Shrink responder's remaining stack so they can shove for MORE than the
    // call (100) but LESS than a full min-raise (100 + 98 = 198) — a short all-in raise.
    responder.stack = 150;
    const legal = computeLegalActionsForPlayer(s2, responder);
    expect(legal.canBetOrRaise).toBe(true);
    expect(legal.raiseIsAllInOnly).toBe(true);
    expect(legal.maxRaiseTo).toBe(responder.committedThisStreet + 150);
  });

  it('does not reopen betting for a player who already called, after a short all-in raise', () => {
    const engine = new HandEngine({ smallBlind: 1, bigBlind: 2, startingStack: 500 }, makePlayers(3), 9);
    engine.startHand();
    const s0 = engine.getState();
    const utg = s0.players.find((p) => p.seat === s0.actingSeat)!.id;
    engine.applyAction(utg, { type: 'call' }); // UTG calls the BB
    const s1 = engine.getState();
    const sbId = s1.players.find((p) => p.seat === s1.actingSeat)!.id;
    engine.applyAction(sbId, { type: 'call' }); // SB completes
    const s2 = engine.getState();
    const bb = s2.players.find((p) => p.seat === s2.actingSeat)!;
    // BB shoves a short all-in that is NOT a full raise (less than min raise of +2 -> to 4 would be min; shove to 3 is a short all-in raise of only 1).
    bb.stack = 1; // committedThisStreet already 2, so all-in makes it 3: a raise of only 1 (less than min raise 2)
    engine.applyAction(bb.id, { type: 'all-in' });
    const s3 = engine.getState();
    expect(s3.lastRaiseWasFullRaise).toBe(false);
    // Both UTG and SB had already acted (called) before the short all-in, so they should now be capped from re-raising.
    expect(s3.cappedFromReraising).toContain(utg);
    expect(s3.cappedFromReraising).toContain(sbId);
    const utgPlayer = s3.players.find((p) => p.id === utg)!;
    const legal = computeLegalActionsForPlayer(s3, utgPlayer);
    expect(legal.canBetOrRaise).toBe(false);
    expect(legal.canCall).toBe(true);
  });
});

describe('legal action generation', () => {
  it('only allows check when nothing is owed, and call when something is owed', () => {
    const engine = new HandEngine(config, makePlayers(2), 3);
    engine.startHand();
    const s = engine.getState();
    const actor = s.players.find((p) => p.seat === s.actingSeat)!;
    const legal = computeLegalActionsForPlayer(s, actor);
    expect(legal.canCheck).toBe(false); // button owes the call vs BB
    expect(legal.canCall).toBe(true);
  });

  it('returns all-false legal actions for a folded or all-in player', () => {
    const engine = new HandEngine(config, makePlayers(2), 3);
    engine.startHand();
    const s = engine.getState();
    const other = s.players.find((p) => p.seat !== s.actingSeat)!;
    other.hasFolded = true;
    const legal = computeLegalActionsForPlayer(s, other);
    expect(legal.canFold).toBe(false);
    expect(legal.canCheck).toBe(false);
    expect(legal.canCall).toBe(false);
    expect(legal.canBetOrRaise).toBe(false);
  });
});

describe('deterministic seeded deals', () => {
  it('produces identical hole cards and community cards for the same seed', () => {
    const e1 = new HandEngine(config, makePlayers(4), 12345);
    const e2 = new HandEngine(config, makePlayers(4), 12345);
    e1.startHand();
    e2.startHand();
    expect(e1.getState().players.map((p) => p.holeCards)).toEqual(e2.getState().players.map((p) => p.holeCards));
  });

  it('produces different deals for different seeds (overwhelmingly likely)', () => {
    const e1 = new HandEngine(config, makePlayers(4), 1);
    const e2 = new HandEngine(config, makePlayers(4), 2);
    e1.startHand();
    e2.startHand();
    expect(e1.getState().players.map((p) => p.holeCards)).not.toEqual(e2.getState().players.map((p) => p.holeCards));
  });
});

describe('complete hand flows', () => {
  it('completes a full hand to showdown via checks and calls, conserving all chips', () => {
    const engine = new HandEngine(config, makePlayers(2), 100);
    engine.startHand();
    const before = chipsInPlay(engine);
    engine.applyAction('p0', { type: 'call' });
    engine.applyAction('p1', { type: 'check' });
    engine.applyAction('p1', { type: 'check' });
    engine.applyAction('p0', { type: 'check' });
    engine.applyAction('p1', { type: 'check' });
    engine.applyAction('p0', { type: 'check' });
    engine.applyAction('p1', { type: 'check' });
    engine.applyAction('p0', { type: 'check' });
    const s = engine.getState();
    expect(s.isHandComplete).toBe(true);
    expect(s.street).toBe('showdown');
    expect(s.showdownResults).not.toBeNull();
    expect(s.showdownResults!.reduce((sum, r) => sum + r.amountWon, 0)).toBe(4); // 2 (SB matched) + 2 (BB), no further betting
    expect(stackTotal(engine)).toBe(before);
  });

  it('awards the pot uncontested when everyone else folds', () => {
    const engine = new HandEngine(config, makePlayers(3), 55);
    engine.startHand();
    const before = chipsInPlay(engine);
    const s0 = engine.getState();
    const first = s0.players.find((p) => p.seat === s0.actingSeat)!.id;
    engine.applyAction(first, { type: 'raise', amount: 10 });
    const s1 = engine.getState();
    const second = s1.players.find((p) => p.seat === s1.actingSeat)!.id;
    engine.applyAction(second, { type: 'fold' });
    const s2 = engine.getState();
    const third = s2.players.find((p) => p.seat === s2.actingSeat)!.id;
    engine.applyAction(third, { type: 'fold' });
    const s3 = engine.getState();
    expect(s3.isHandComplete).toBe(true);
    expect(s3.showdownResults!.find((r) => r.playerId === first)!.amountWon).toBeGreaterThan(0);
    expect(stackTotal(engine)).toBe(before);
    // No hands revealed on an uncontested pot.
    expect(s3.showdownResults!.every((r) => r.handValue === null)).toBe(true);
  });

  it('handles a three-way all-in with a side pot correctly', () => {
    const engine = new HandEngine({ smallBlind: 5, bigBlind: 10, startingStack: 1000 }, makePlayers(3), 21);
    engine.startHand();
    const s0 = engine.getState();
    // Make one player a short stack before the hand's action to force a side pot.
    const shortStack = s0.players[2];
    shortStack.stack = 40; // total chips available to this player this hand (already posted BB=10, so 30 left behind if BB)
    // Capture the conservation baseline AFTER this manual test-fixture adjustment.
    const before = chipsInPlay(engine);
    // Recompute: rebuild scenario deterministically by just driving actions; whoever acts first shoves small, others call/raise big.
    const firstId = s0.players.find((p) => p.seat === s0.actingSeat)!.id;
    engine.applyAction(firstId, { type: 'all-in' });
    let s = engine.getState();
    while (!s.isHandComplete && s.actingSeat !== null) {
      const actorId = s.players.find((p) => p.seat === s.actingSeat)!.id;
      const legal = computeLegalActionsForPlayer(s, s.players.find((p) => p.id === actorId)!);
      if (legal.canCall) engine.applyAction(actorId, { type: 'call' });
      else if (legal.canCheck) engine.applyAction(actorId, { type: 'check' });
      else engine.applyAction(actorId, { type: 'fold' });
      s = engine.getState();
    }
    expect(s.isHandComplete).toBe(true);
    expect(stackTotal(engine)).toBe(before);
    expect(s.showdownResults!.reduce((sum, r) => sum + r.amountWon, 0)).toBeGreaterThan(0);
  });
});

describe('development error guarding', () => {
  it('throws a clear error instead of silently acting out of turn', () => {
    const engine = new HandEngine(config, makePlayers(3), 2);
    engine.startHand();
    const s = engine.getState();
    const notActing = s.players.find((p) => p.seat !== s.actingSeat)!;
    expect(() => engine.applyAction(notActing.id, { type: 'fold' })).toThrow(DevelopmentError);
  });

  it('throws when starting a new hand while one is in progress', () => {
    const engine = new HandEngine(config, makePlayers(2), 2);
    engine.startHand();
    expect(() => engine.startHand()).toThrow(DevelopmentError);
  });

  it('throws when starting a hand with fewer than 2 active players', () => {
    const engine = new HandEngine(config, makePlayers(2), 2);
    engine.getState().players[1].isActive = false;
    expect(() => engine.startHand()).toThrow(DevelopmentError);
  });
});

describe('getTotalPot', () => {
  it('sums all players committed totals', () => {
    const engine = new HandEngine(config, makePlayers(2), 2);
    engine.startHand();
    expect(getTotalPot(engine.getState())).toBe(3); // 1 (sb) + 2 (bb)
  });
});
