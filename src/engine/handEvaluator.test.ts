import { describe, it, expect } from 'vitest';
import { parseCard } from './cards';
import { evaluateBest, evaluateFive, compareHandValues, HandCategory } from './handEvaluator';

function cards(str: string) {
  return str.split(' ').map(parseCard);
}

describe('evaluateFive - category detection', () => {
  it('detects a straight flush', () => {
    const v = evaluateFive(cards('9h 8h 7h 6h 5h'));
    expect(v.category).toBe(HandCategory.StraightFlush);
    expect(v.tiebreakers).toEqual([9]);
  });

  it('detects the steel-wheel (ace-low straight flush)', () => {
    const v = evaluateFive(cards('Ah 2h 3h 4h 5h'));
    expect(v.category).toBe(HandCategory.StraightFlush);
    expect(v.tiebreakers).toEqual([5]);
  });

  it('does not misdetect a flush + broken straight as a straight flush', () => {
    const v = evaluateFive(cards('Ah Kh Qh Jh 9h'));
    expect(v.category).toBe(HandCategory.Flush);
  });

  it('detects four of a kind with correct kicker', () => {
    const v = evaluateFive(cards('9c 9d 9h 9s Kd'));
    expect(v.category).toBe(HandCategory.FourOfAKind);
    expect(v.tiebreakers).toEqual([9, 13]);
  });

  it('detects a full house (trips over pair)', () => {
    const v = evaluateFive(cards('7c 7d 7h 3s 3d'));
    expect(v.category).toBe(HandCategory.FullHouse);
    expect(v.tiebreakers).toEqual([7, 3]);
  });

  it('detects a flush with descending kickers', () => {
    const v = evaluateFive(cards('Ac 9c 7c 4c 2c'));
    expect(v.category).toBe(HandCategory.Flush);
    expect(v.tiebreakers).toEqual([14, 9, 7, 4, 2]);
  });

  it('detects a normal straight', () => {
    const v = evaluateFive(cards('Tc 9d 8h 7s 6d'));
    expect(v.category).toBe(HandCategory.Straight);
    expect(v.tiebreakers).toEqual([10]);
  });

  it('detects the ace-low straight (the wheel)', () => {
    const v = evaluateFive(cards('Ac 2d 3h 4s 5d'));
    expect(v.category).toBe(HandCategory.Straight);
    expect(v.tiebreakers).toEqual([5]);
  });

  it('does not treat ace as connecting K-A-2 as a straight', () => {
    const v = evaluateFive(cards('Kc Ad 2h 3s 4d'));
    expect(v.category).not.toBe(HandCategory.Straight);
  });

  it('detects three of a kind with kickers', () => {
    const v = evaluateFive(cards('5c 5d 5h Kd 2s'));
    expect(v.category).toBe(HandCategory.ThreeOfAKind);
    expect(v.tiebreakers).toEqual([5, 13, 2]);
  });

  it('detects two pair with kicker', () => {
    const v = evaluateFive(cards('Jc Jd 4h 4s 9d'));
    expect(v.category).toBe(HandCategory.TwoPair);
    expect(v.tiebreakers).toEqual([11, 4, 9]);
  });

  it('detects one pair with three kickers', () => {
    const v = evaluateFive(cards('Qc Qd 9h 5s 2d'));
    expect(v.category).toBe(HandCategory.OnePair);
    expect(v.tiebreakers).toEqual([12, 9, 5, 2]);
  });

  it('detects high card', () => {
    const v = evaluateFive(cards('Ac Jd 8h 5s 2d'));
    expect(v.category).toBe(HandCategory.HighCard);
    expect(v.tiebreakers).toEqual([14, 11, 8, 5, 2]);
  });
});

describe('evaluateBest - 7 card selection', () => {
  it('picks the best 5 of 7, ignoring worse kickers', () => {
    // Board pairs the board; player has an overpair that should win via best-5 selection.
    const v = evaluateBest(cards('Ac Ad 7h 7d 2s 3c 4d'));
    expect(v.category).toBe(HandCategory.TwoPair);
    expect(v.tiebreakers[0]).toBe(14);
    expect(v.tiebreakers[1]).toBe(7);
  });

  it('handles board-only best hand (community cards beat both hole cards)', () => {
    // Board itself is a straight flush; hole cards are irrelevant scraps.
    const board = cards('9h 8h 7h 6h 5h');
    const hole = cards('2c 3d');
    const v = evaluateBest([...hole, ...board]);
    expect(v.category).toBe(HandCategory.StraightFlush);
    expect(v.tiebreakers).toEqual([9]);
  });

  it('finds the best straight among multiple possible straights', () => {
    const v = evaluateBest(cards('4c 5d 6h 7s 8d 9c Th'));
    expect(v.category).toBe(HandCategory.Straight);
    expect(v.tiebreakers).toEqual([10]);
  });
});

describe('compareHandValues', () => {
  it('ranks a higher category above a lower one regardless of tiebreakers', () => {
    const pair = evaluateFive(cards('2c 2d 9h 8s 4d'));
    const straight = evaluateFive(cards('5c 6d 7h 8s 9d'));
    expect(compareHandValues(straight, pair)).toBeGreaterThan(0);
  });

  it('breaks ties by kicker for one pair', () => {
    const better = evaluateFive(cards('Ac Ad Kh 8s 4d')); // pair of aces, K kicker
    const worse = evaluateFive(cards('Ah As Qh 8d 4c')); // pair of aces, Q kicker
    expect(compareHandValues(better, worse)).toBeGreaterThan(0);
  });

  it('compares full houses by trip rank first, then pair rank', () => {
    const better = evaluateFive(cards('8c 8d 8h 2s 2d')); // 888 22
    const worse = evaluateFive(cards('7c 7d 7h Ks Kd')); // 777 KK
    expect(compareHandValues(better, worse)).toBeGreaterThan(0);
  });

  it('compares flushes card by card', () => {
    const better = evaluateFive(cards('Ac Kc 9c 4c 2c'));
    const worse = evaluateFive(cards('Ah Kh 9h 3h 2h'));
    expect(compareHandValues(better, worse)).toBeGreaterThan(0);
  });

  it('returns 0 for genuinely identical hand values (split pot case)', () => {
    const a = evaluateFive(cards('Ac Kd Qh Js 9d'));
    const b = evaluateFive(cards('As Kh Qd Jc 9h'));
    expect(compareHandValues(a, b)).toBe(0);
  });

  it('treats board-only ties as a split pot when both players play the board', () => {
    const board = cards('Ac Kd Qh Js 9d');
    const p1 = evaluateBest([...cards('2c 3d'), ...board]);
    const p2 = evaluateBest([...cards('7h 6s'), ...board]);
    expect(compareHandValues(p1, p2)).toBe(0);
  });
});

describe('deck uniqueness sanity (evaluator input assumptions)', () => {
  it('throws on fewer than 5 cards', () => {
    expect(() => evaluateBest(cards('Ac Kd Qh'))).toThrow();
  });
});
