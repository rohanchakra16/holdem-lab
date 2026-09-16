import { describe, it, expect } from 'vitest';
import { calculateSidePots, splitPotAmount } from './potManager';

describe('calculateSidePots', () => {
  it('creates a single pot when all players contribute equally', () => {
    const { pots, refund } = calculateSidePots([
      { playerId: 'a', committedTotal: 100, hasFolded: false },
      { playerId: 'b', committedTotal: 100, hasFolded: false },
      { playerId: 'c', committedTotal: 100, hasFolded: false },
    ]);
    expect(refund).toBeNull();
    expect(pots).toHaveLength(1);
    expect(pots[0].amount).toBe(300);
    expect(pots[0].eligiblePlayerIds.sort()).toEqual(['a', 'b', 'c']);
  });

  it('refunds an uncalled raise to the sole top contributor', () => {
    const { pots, refund } = calculateSidePots([
      { playerId: 'a', committedTotal: 50, hasFolded: false },
      { playerId: 'b', committedTotal: 200, hasFolded: false }, // raised, nobody called the extra 150
    ]);
    expect(refund).toEqual({ playerId: 'b', amount: 150 });
    expect(pots).toHaveLength(1);
    expect(pots[0].amount).toBe(100); // 50 + 50 (b's matched portion)
    expect(pots[0].eligiblePlayerIds.sort()).toEqual(['a', 'b']);
  });

  it('does not refund when two players share the top contribution', () => {
    const { pots, refund } = calculateSidePots([
      { playerId: 'a', committedTotal: 200, hasFolded: false },
      { playerId: 'b', committedTotal: 200, hasFolded: false },
      { playerId: 'c', committedTotal: 50, hasFolded: true },
    ]);
    expect(refund).toBeNull();
    const total = pots.reduce((s, p) => s + p.amount, 0);
    expect(total).toBe(450);
  });

  it('builds a main pot and side pot for a single short all-in', () => {
    // a is all-in for 50, b and c both put in 150.
    const { pots, refund } = calculateSidePots([
      { playerId: 'a', committedTotal: 50, hasFolded: false },
      { playerId: 'b', committedTotal: 150, hasFolded: false },
      { playerId: 'c', committedTotal: 150, hasFolded: false },
    ]);
    expect(refund).toBeNull();
    expect(pots).toHaveLength(2);
    expect(pots[0].amount).toBe(150); // 50 * 3 main pot
    expect(pots[0].eligiblePlayerIds.sort()).toEqual(['a', 'b', 'c']);
    expect(pots[1].amount).toBe(200); // (150-50)*2 side pot
    expect(pots[1].eligiblePlayerIds.sort()).toEqual(['b', 'c']);
  });

  it('builds multiple side pots for multiple distinct all-in levels', () => {
    const { pots } = calculateSidePots([
      { playerId: 'a', committedTotal: 20, hasFolded: false }, // shortest all-in
      { playerId: 'b', committedTotal: 60, hasFolded: false }, // mid all-in
      { playerId: 'c', committedTotal: 150, hasFolded: false },
      { playerId: 'd', committedTotal: 150, hasFolded: false },
    ]);
    // levels: 20, 60, 150
    expect(pots).toHaveLength(3);
    expect(pots[0].amount).toBe(20 * 4); // 80, all 4 eligible
    expect(pots[1].amount).toBe(40 * 3); // (60-20)*3 = 120, b/c/d eligible
    expect(pots[2].amount).toBe(90 * 2); // (150-60)*2 = 180, c/d eligible
    expect(pots[0].eligiblePlayerIds.sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(pots[1].eligiblePlayerIds.sort()).toEqual(['b', 'c', 'd']);
    expect(pots[2].eligiblePlayerIds.sort()).toEqual(['c', 'd']);
  });

  it('excludes folded players from eligibility but keeps their chips in the pot', () => {
    const { pots } = calculateSidePots([
      { playerId: 'a', committedTotal: 100, hasFolded: true },
      { playerId: 'b', committedTotal: 100, hasFolded: false },
    ]);
    expect(pots).toHaveLength(1);
    expect(pots[0].amount).toBe(200);
    expect(pots[0].eligiblePlayerIds).toEqual(['b']);
  });

  it('handles a short all-in that gets called down then the caller folds to a later re-raise (only the last aggressive action refunds)', () => {
    const { pots, refund } = calculateSidePots([
      { playerId: 'allin', committedTotal: 40, hasFolded: false },
      { playerId: 'caller', committedTotal: 40, hasFolded: true },
      { playerId: 'raiser', committedTotal: 300, hasFolded: false },
    ]);
    expect(refund).toEqual({ playerId: 'raiser', amount: 260 });
    expect(pots).toHaveLength(1);
    expect(pots[0].amount).toBe(120);
  });
});

describe('splitPotAmount', () => {
  it('splits evenly with no remainder', () => {
    const result = splitPotAmount(100, ['a', 'b']);
    expect(result.get('a')).toBe(50);
    expect(result.get('b')).toBe(50);
  });

  it('awards the odd chip to the first winner in order', () => {
    const result = splitPotAmount(101, ['a', 'b']);
    expect(result.get('a')).toBe(51);
    expect(result.get('b')).toBe(50);
  });

  it('handles three-way splits with two odd chips', () => {
    const result = splitPotAmount(101, ['a', 'b', 'c']);
    expect(result.get('a')).toBe(34);
    expect(result.get('b')).toBe(34);
    expect(result.get('c')).toBe(33);
  });
});
