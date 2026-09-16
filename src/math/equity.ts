import { Card, RANKS, SUITS } from '../engine/cards';
import { compareHandValues, evaluateBest } from '../engine/handEvaluator';
import { mulberry32, RNG, shuffleInPlace } from '../engine/rng';

export interface EquityResult {
  winRate: number;
  tieRate: number;
  loseRate: number;
  iterations: number;
}

function cardKey(c: Card): string {
  return `${c.rank}${c.suit}`;
}

function remainingDeck(known: Card[]): Card[] {
  const knownKeys = new Set(known.map(cardKey));
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const c = { rank, suit };
      if (!knownKeys.has(cardKey(c))) deck.push(c);
    }
  }
  return deck;
}

/**
 * Monte Carlo equity of hero's hole cards vs. N random opponent hands, given
 * a (possibly partial) board. This is a SIMULATION-BASED ESTIMATE, not exact
 * math — more iterations reduce variance but never eliminate it. Suitable
 * for teaching/UI purposes at a few thousand iterations.
 */
export function equityVsRandomHands(
  hero: Card[],
  board: Card[],
  numOpponents: number,
  iterations = 3000,
  rng: RNG = mulberry32(12345)
): EquityResult {
  let win = 0;
  let tie = 0;
  let lose = 0;
  const known = [...hero, ...board];

  for (let i = 0; i < iterations; i++) {
    const deck = shuffleInPlace(remainingDeck(known), rng);
    let idx = 0;
    const opponents: Card[][] = [];
    for (let o = 0; o < numOpponents; o++) opponents.push([deck[idx++], deck[idx++]]);
    const boardFillCount = 5 - board.length;
    const fullBoard = [...board, ...deck.slice(idx, idx + boardFillCount)];

    const heroValue = evaluateBest([...hero, ...fullBoard]);
    const oppValues = opponents.map((h) => evaluateBest([...h, ...fullBoard]));
    const bestOpp = oppValues.reduce((best, v) => (compareHandValues(v, best) > 0 ? v : best));
    const cmp = compareHandValues(heroValue, bestOpp);
    if (cmp > 0) win++;
    else if (cmp === 0) tie++;
    else lose++;
  }

  return { winRate: win / iterations, tieRate: tie / iterations, loseRate: lose / iterations, iterations };
}

/**
 * Monte Carlo equity of hero's hole cards vs. a specific single opponent
 * hand (both fully known), running out the remaining board many times.
 */
export function equityVsSpecificHand(
  hero: Card[],
  villain: Card[],
  board: Card[],
  iterations = 3000,
  rng: RNG = mulberry32(54321)
): EquityResult {
  let win = 0;
  let tie = 0;
  let lose = 0;
  const known = [...hero, ...villain, ...board];

  for (let i = 0; i < iterations; i++) {
    const deck = shuffleInPlace(remainingDeck(known), rng);
    const boardFillCount = 5 - board.length;
    const fullBoard = [...board, ...deck.slice(0, boardFillCount)];
    const heroValue = evaluateBest([...hero, ...fullBoard]);
    const villainValue = evaluateBest([...villain, ...fullBoard]);
    const cmp = compareHandValues(heroValue, villainValue);
    if (cmp > 0) win++;
    else if (cmp === 0) tie++;
    else lose++;
  }
  return { winRate: win / iterations, tieRate: tie / iterations, loseRate: lose / iterations, iterations };
}

/**
 * Monte Carlo equity of hero's hole cards vs. a uniformly-sampled range of
 * possible opponent starting hands (each entry a 2-card combo). Hands that
 * conflict with already-known cards are skipped and re-sampled.
 */
export function equityVsRange(
  hero: Card[],
  board: Card[],
  range: Card[][],
  iterations = 3000,
  rng: RNG = mulberry32(24680)
): EquityResult {
  let win = 0;
  let tie = 0;
  let lose = 0;
  let counted = 0;
  const knownKeys = new Set([...hero, ...board].map(cardKey));
  const validRange = range.filter((h) => !h.some((c) => knownKeys.has(cardKey(c))));
  if (validRange.length === 0) throw new Error('No valid range combos remain given known cards');

  for (let i = 0; i < iterations; i++) {
    const villain = validRange[Math.floor(rng() * validRange.length)];
    const known = [...hero, ...villain, ...board];
    const deck = shuffleInPlace(remainingDeck(known), rng);
    const boardFillCount = 5 - board.length;
    const fullBoard = [...board, ...deck.slice(0, boardFillCount)];
    const heroValue = evaluateBest([...hero, ...fullBoard]);
    const villainValue = evaluateBest([...villain, ...fullBoard]);
    const cmp = compareHandValues(heroValue, villainValue);
    if (cmp > 0) win++;
    else if (cmp === 0) tie++;
    else lose++;
    counted++;
  }
  return { winRate: win / counted, tieRate: tie / counted, loseRate: lose / counted, iterations: counted };
}
