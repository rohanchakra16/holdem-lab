import { combinations } from './combinatorics';

/**
 * The "rule of 2 and 4": a fast mental approximation for equity given a
 * number of outs. Multiply outs by 4 with two cards to come (flop to river)
 * or by 2 with one card to come (turn to river). This is explicitly an
 * APPROXIMATION — it slightly overstates equity for high out counts because
 * it does not account for the two-card case's diminishing marginal draws.
 */
export function ruleOfTwoAndFour(outs: number, cardsToCome: 1 | 2): number {
  const multiplier = cardsToCome === 2 ? 4 : 2;
  return Math.min(100, outs * multiplier);
}

/**
 * The EXACT probability of hitting at least one of `outs` cards within
 * `cardsToCome` draws from `unseenCards` remaining unseen cards, computed via
 * the hypergeometric distribution (no replacement).
 */
export function exactOutsEquity(outs: number, unseenCards: number, cardsToCome: number): number {
  if (outs < 0 || unseenCards <= 0 || cardsToCome <= 0) return 0;
  if (outs > unseenCards) throw new Error('outs cannot exceed unseenCards');
  const missCount = unseenCards - outs;
  if (cardsToCome > unseenCards) throw new Error('cardsToCome cannot exceed unseenCards');
  const waysToMissAll = combinations(missCount, cardsToCome);
  const waysTotal = combinations(unseenCards, cardsToCome);
  if (waysTotal === 0) return 0;
  return 1 - waysToMissAll / waysTotal;
}

/** Standard unseen-card count for a player holding 2 hole cards against a board of `boardSize` cards, from a 52-card deck. */
export function unseenCardCount(boardSize: number): number {
  return 52 - 2 - boardSize;
}
