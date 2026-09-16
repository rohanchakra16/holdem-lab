import { Card, Rank } from './cards';

/** Higher numeric value = stronger hand category. */
export enum HandCategory {
  HighCard = 0,
  OnePair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
}

export const HAND_CATEGORY_NAMES: Record<HandCategory, string> = {
  [HandCategory.HighCard]: 'High Card',
  [HandCategory.OnePair]: 'One Pair',
  [HandCategory.TwoPair]: 'Two Pair',
  [HandCategory.ThreeOfAKind]: 'Three of a Kind',
  [HandCategory.Straight]: 'Straight',
  [HandCategory.Flush]: 'Flush',
  [HandCategory.FullHouse]: 'Full House',
  [HandCategory.FourOfAKind]: 'Four of a Kind',
  [HandCategory.StraightFlush]: 'Straight Flush',
};

export interface HandValue {
  category: HandCategory;
  /** Ranks in comparison priority order (highest priority first), used for tie-breaking. */
  tiebreakers: number[];
  /** The specific 5 cards that make up this hand value. */
  cards: Card[];
}

/** Compares two hand values. Positive if `a` beats `b`, negative if `b` beats `a`, 0 if exactly tied. */
export function compareHandValues(a: HandValue, b: HandValue): number {
  if (a.category !== b.category) return a.category - b.category;
  const len = Math.max(a.tiebreakers.length, b.tiebreakers.length);
  for (let i = 0; i < len; i++) {
    const av = a.tiebreakers[i] ?? 0;
    const bv = b.tiebreakers[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function combinations<T>(arr: T[], k: number): T[][] {
  const results: T[][] = [];
  const combo: T[] = [];
  function recurse(start: number) {
    if (combo.length === k) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      recurse(i + 1);
      combo.pop();
    }
  }
  recurse(0);
  return results;
}

/** Finds the high card of a straight among descending, de-duplicated ranks. Returns null if none. Handles the wheel (A-2-3-4-5). */
function findStraightHigh(uniqueDescRanks: number[]): number | null {
  const list = [...uniqueDescRanks];
  if (list.includes(14)) list.push(1); // ace can also play low
  for (let i = 0; i + 4 < list.length; i++) {
    if (list[i] - list[i + 4] === 4) {
      return list[i] === 1 ? 5 : list[i];
    }
  }
  return null;
}

/** Evaluates exactly 5 cards into a HandValue. */
export function evaluateFive(cards: Card[]): HandValue {
  if (cards.length !== 5) throw new Error(`evaluateFive requires exactly 5 cards, got ${cards.length}`);

  const bySuit = new Map<string, Card[]>();
  const countByRank = new Map<Rank, number>();
  for (const c of cards) {
    bySuit.set(c.suit, [...(bySuit.get(c.suit) ?? []), c]);
    countByRank.set(c.rank, (countByRank.get(c.rank) ?? 0) + 1);
  }

  const flushSuit = [...bySuit.entries()].find(([, cs]) => cs.length >= 5)?.[0];
  const isFlush = flushSuit !== undefined;

  const uniqueRanksDesc = [...countByRank.keys()].sort((a, b) => b - a);
  const straightHigh = findStraightHigh(uniqueRanksDesc);

  if (isFlush && straightHigh !== null) {
    const flushCards = bySuit.get(flushSuit!)!;
    const flushRanks = new Set(flushCards.map((c) => c.rank));
    // Confirm the straight ranks are all present within the flush suit (straight flush, not just a flush + a straight).
    const straightRanks =
      straightHigh === 5 ? [5, 4, 3, 2, 14] : [straightHigh, straightHigh - 1, straightHigh - 2, straightHigh - 3, straightHigh - 4];
    if (straightRanks.every((r) => flushRanks.has(r as Rank))) {
      return { category: HandCategory.StraightFlush, tiebreakers: [straightHigh], cards };
    }
  }

  const groups = [...countByRank.entries()].sort((a, b) => (b[1] - a[1]) || (b[0] - a[0]));

  if (groups[0][1] === 4) {
    const kicker = groups.find(([, n]) => n === 1)![0];
    return { category: HandCategory.FourOfAKind, tiebreakers: [groups[0][0], kicker], cards };
  }

  if (groups[0][1] === 3 && groups[1]?.[1] >= 2) {
    return { category: HandCategory.FullHouse, tiebreakers: [groups[0][0], groups[1][0]], cards };
  }

  if (isFlush) {
    const ranks = bySuit.get(flushSuit!)!.map((c) => c.rank).sort((a, b) => b - a).slice(0, 5);
    return { category: HandCategory.Flush, tiebreakers: ranks, cards };
  }

  if (straightHigh !== null) {
    return { category: HandCategory.Straight, tiebreakers: [straightHigh], cards };
  }

  if (groups[0][1] === 3) {
    const kickers = groups.filter(([, n]) => n === 1).map(([r]) => r).sort((a, b) => b - a);
    return { category: HandCategory.ThreeOfAKind, tiebreakers: [groups[0][0], ...kickers], cards };
  }

  if (groups[0][1] === 2 && groups[1]?.[1] === 2) {
    const pairs = groups.filter(([, n]) => n === 2).map(([r]) => r).sort((a, b) => b - a);
    const kicker = groups.find(([, n]) => n === 1)![0];
    return { category: HandCategory.TwoPair, tiebreakers: [pairs[0], pairs[1], kicker], cards };
  }

  if (groups[0][1] === 2) {
    const kickers = groups.filter(([, n]) => n === 1).map(([r]) => r).sort((a, b) => b - a);
    return { category: HandCategory.OnePair, tiebreakers: [groups[0][0], ...kickers], cards };
  }

  const highCards = uniqueRanksDesc.slice(0, 5);
  return { category: HandCategory.HighCard, tiebreakers: highCards, cards };
}

/**
 * Evaluates the best 5-card hand from any 5, 6, or 7 cards (hole + board).
 * Tries every 5-card combination and keeps the strongest.
 */
export function evaluateBest(cards: Card[]): HandValue {
  if (cards.length < 5) throw new Error(`evaluateBest requires at least 5 cards, got ${cards.length}`);
  if (cards.length === 5) return evaluateFive(cards);
  let best: HandValue | null = null;
  for (const combo of combinations(cards, 5)) {
    const value = evaluateFive(combo);
    if (!best || compareHandValues(value, best) > 0) best = value;
  }
  return best!;
}

export function handCategoryName(category: HandCategory): string {
  return HAND_CATEGORY_NAMES[category];
}
