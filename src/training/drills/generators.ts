import { Card, RANKS, SUITS, cardToDisplay } from '../../engine/cards';
import { evaluateFive, handCategoryName, compareHandValues, HandCategory } from '../../engine/handEvaluator';
import { exactOutsEquity, ruleOfTwoAndFour } from '../../math/outs';
import { requiredEquityToCall } from '../../math/potOdds';
import { evOfBet, evOfCall } from '../../math/ev';
import { combinations } from '../../math/combinatorics';

export type DrillCategory =
  | 'hand-ranking'
  | 'best-five'
  | 'outs'
  | 'draw-probability'
  | 'pot-odds'
  | 'call-ev'
  | 'bet-ev-fold-equity'
  | 'combinations-blockers'
  | 'preflop-decision'
  | 'bet-sizing'
  | 'strategy-concepts';

export type AnswerKind = 'choice' | 'numeric';

export interface Drill {
  category: DrillCategory;
  prompt: string;
  context?: string;
  answerKind: AnswerKind;
  choices?: string[];
  correctIndex?: number;
  correctValue?: number;
  tolerance?: number; // for numeric answers, absolute tolerance
  unit?: string;
  calculationSteps: string[];
  fastestMethod: string;
  interpretation: string;
  whyAlternativesWrong: string;
  assumptions: string;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomCard(exclude: Card[] = []): Card {
  const excludeKeys = new Set(exclude.map((c) => `${c.rank}${c.suit}`));
  let card: Card;
  do {
    card = { rank: RANKS[randInt(0, RANKS.length - 1)], suit: SUITS[randInt(0, SUITS.length - 1)] };
  } while (excludeKeys.has(`${card.rank}${card.suit}`));
  return card;
}

function randomHand(n: number): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < n; i++) cards.push(randomCard(cards));
  return cards;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

export function generateHandRankingDrill(): Drill {
  const handA = randomHand(5);
  const handB = randomHand(5);
  const valueA = evaluateFive(handA);
  const valueB = evaluateFive(handB);
  const cmp = compareHandValues(valueA, valueB);
  const correctIndex = cmp === 0 ? 2 : cmp > 0 ? 0 : 1;
  return {
    category: 'hand-ranking',
    prompt: 'Which hand wins?',
    context: `Hand A: ${handA.map(cardToDisplay).join(' ')}   ·   Hand B: ${handB.map(cardToDisplay).join(' ')}`,
    answerKind: 'choice',
    choices: ['Hand A', 'Hand B', "It's a tie / split pot"],
    correctIndex,
    calculationSteps: [
      `Hand A is ${handCategoryName(valueA.category)} (tiebreakers: ${valueA.tiebreakers.join(', ')})`,
      `Hand B is ${handCategoryName(valueB.category)} (tiebreakers: ${valueB.tiebreakers.join(', ')})`,
      cmp === 0 ? 'Both hands have identical category and tiebreakers — a genuine tie.' : 'Compare category first, then tiebreakers in order.',
    ],
    fastestMethod: 'Identify each hand’s category first (that alone decides most match-ups) before comparing exact ranks.',
    interpretation: 'Category beats category regardless of specific ranks; only compare ranks/kickers when categories match.',
    whyAlternativesWrong: 'A common error is comparing high cards first without checking hand category — category always takes priority.',
    assumptions: 'Both hands are evaluated independently as exactly 5 cards (no shared board in this drill).',
  };
}

export function generateBestFiveDrill(): Drill {
  const sevenCards = randomHand(7);
  // Find best combo by brute force (small enough for a drill).
  function combos<T>(arr: T[], k: number): T[][] {
    const results: T[][] = [];
    const c: T[] = [];
    (function rec(start: number) {
      if (c.length === k) { results.push([...c]); return; }
      for (let i = start; i < arr.length; i++) { c.push(arr[i]); rec(i + 1); c.pop(); }
    })(0);
    return results;
  }
  let best = evaluateFive(combos(sevenCards, 5)[0]);
  for (const combo of combos(sevenCards, 5)) {
    const v = evaluateFive(combo);
    if (compareHandValues(v, best) > 0) best = v;
  }
  const categories = Object.values(HandCategory).filter((v) => typeof v === 'number') as number[];
  const choices = [...new Set([best.category, ...categories.filter(() => Math.random() < 0.4)])].slice(0, 4);
  if (!choices.includes(best.category)) choices[0] = best.category;
  const shuffled = choices.sort(() => Math.random() - 0.5);
  return {
    category: 'best-five',
    prompt: 'What is the best 5-card hand category available from these 7 cards?',
    context: sevenCards.map(cardToDisplay).join(' '),
    answerKind: 'choice',
    choices: shuffled.map((c) => handCategoryName(c as HandCategory)),
    correctIndex: shuffled.indexOf(best.category),
    calculationSteps: [
      `The best 5-card combination is: ${best.cards.map(cardToDisplay).join(' ')}`,
      `That is a ${handCategoryName(best.category)}.`,
    ],
    fastestMethod: 'Scan for pairs/trips first (fast to spot), then check for 5-in-a-suit (flush) and 5-in-a-row (straight).',
    interpretation: 'With 7 cards there are 21 possible 5-card combinations — always pick the single best one, not just the first one you notice.',
    whyAlternativesWrong: 'A frequent mistake is stopping at the first pair/straight noticed instead of checking for a stronger combination hiding in the same 7 cards.',
    assumptions: 'All 7 cards are known (as in a river showdown) — no cards remain hidden.',
  };
}

export function generateOutsDrill(): Drill {
  const scenarios = [
    { desc: 'You have a flush draw (4 cards of one suit) with two cards to come.', outs: 9 },
    { desc: 'You have an open-ended straight draw with two cards to come.', outs: 8 },
    { desc: 'You have a gutshot (inside) straight draw with two cards to come.', outs: 4 },
    { desc: 'You have top pair and are drawing to trips (2 outs) plus a backdoor consideration ignored — just count the trips outs.', outs: 2 },
    { desc: 'You have an open-ended straight draw AND a flush draw (combo draw) with two cards to come.', outs: 15 },
    { desc: 'You have two overcards to the board (e.g. AK on a low, unpaired board) with two cards to come.', outs: 6 },
  ];
  const s = pick(scenarios);
  return {
    category: 'outs',
    prompt: 'How many outs do you have?',
    context: s.desc,
    answerKind: 'numeric',
    correctValue: s.outs,
    tolerance: 0,
    unit: 'outs',
    calculationSteps: [`This is a standard textbook draw: ${s.desc}`, `Standard out count: ${s.outs}.`],
    fastestMethod: 'Memorize the common draw sizes: gutshot=4, two overcards=6, flush draw=9, open-ended straight=8, combo draw=15.',
    interpretation: 'Outs count cards that make your hand likely best — always sanity-check they don’t also complete a bigger hand for an opponent.',
    whyAlternativesWrong: 'Double-counting outs shared between two draws (e.g. counting a card once for the flush and again for the straight) inflates the true count.',
    assumptions: 'Assumes no outs are already visible on the board or in your hand, and that hitting the out makes the best hand (not always guaranteed in real play).',
  };
}

export function generateDrawProbabilityDrill(): Drill {
  const outs = pick([4, 6, 8, 9, 12, 15]);
  const cardsToCome = pick([1, 2]) as 1 | 2;
  const unseen = cardsToCome === 2 ? 47 : 46;
  const exact = exactOutsEquity(outs, unseen, cardsToCome) * 100;
  return {
    category: 'draw-probability',
    prompt: `With ${outs} outs and ${cardsToCome} card(s) to come, what is the EXACT probability (%) of hitting at least one out?`,
    answerKind: 'numeric',
    correctValue: Math.round(exact * 10) / 10,
    tolerance: 1.5,
    unit: '%',
    calculationSteps: [
      `Unseen cards: ${unseen}`,
      `Exact = 1 − C(${unseen - outs}, ${cardsToCome}) / C(${unseen}, ${cardsToCome})`,
      `≈ ${exact.toFixed(1)}%`,
      `(Rule of ${cardsToCome === 2 ? 4 : 2} approximation would say ${ruleOfTwoAndFour(outs, cardsToCome)}%.)`,
    ],
    fastestMethod: `Rule of ${cardsToCome === 2 ? 4 : 2}: outs × ${cardsToCome === 2 ? 4 : 2} ≈ ${ruleOfTwoAndFour(outs, cardsToCome)}% (fast, slightly high for big out counts).`,
    interpretation: 'The exact hypergeometric probability is the real answer; the rule of 2/4 is a fast mental shortcut that gets close.',
    whyAlternativesWrong: 'Using the rule of 4 with only one card left to come (should be rule of 2) roughly doubles the true answer.',
    assumptions: 'Assumes outs and unseen-card counts are accurate and independent of opponents’ hidden cards beyond the given count.',
  };
}

export function generatePotOddsDrill(): Drill {
  const pot = randInt(2, 20) * 10;
  const call = randInt(1, 10) * 10;
  const required = requiredEquityToCall(pot, call) * 100;
  return {
    category: 'pot-odds',
    prompt: `The pot is ${pot} and you must call ${call} to continue. What equity do you need to break even (%)?`,
    answerKind: 'numeric',
    correctValue: Math.round(required * 10) / 10,
    tolerance: 0.6,
    unit: '%',
    calculationSteps: [`Required equity = call ÷ (pot + call)`, `= ${call} ÷ (${pot} + ${call})`, `= ${required.toFixed(1)}%`],
    fastestMethod: 'Convert to a ratio first (pot : call), then required% = call/(pot+call) — or memorize common ratios (2:1 → 33%, 3:1 → 25%, 4:1 → 20%).',
    interpretation: 'This is EXACT arithmetic, not an estimate — the only uncertain input in a real hand is your actual equity, which you must estimate separately.',
    whyAlternativesWrong: 'A common error is dividing call by pot alone (ignoring that your call ADDS to the pot you could win) instead of call by (pot+call).',
    assumptions: 'Ignores implied odds (future betting) — purely the current-street break-even point.',
  };
}

export function generateCallEvDrill(): Drill {
  const pot = randInt(3, 15) * 10;
  const call = randInt(1, 8) * 10;
  const winPct = randInt(10, 80);
  const ev = evOfCall({ potBeforeCall: pot, callAmount: call, winProbability: winPct / 100 });
  return {
    category: 'call-ev',
    prompt: `Pot before your call: ${pot}. Call amount: ${call}. Your estimated win probability: ${winPct}%. What is the EV of calling?`,
    answerKind: 'numeric',
    correctValue: Math.round(ev * 10) / 10,
    tolerance: Math.max(2, Math.abs(ev) * 0.08),
    unit: 'chips',
    calculationSteps: [
      `EV(call) = win% × (pot + call) − call`,
      `= ${(winPct / 100).toFixed(2)} × (${pot} + ${call}) − ${call}`,
      `= ${(winPct / 100).toFixed(2)} × ${pot + call} − ${call}`,
      `= ${ev.toFixed(1)}`,
    ],
    fastestMethod: 'Compute the final pot first (pot+call), multiply by win%, then subtract the call amount.',
    interpretation: ev >= 0 ? 'Positive EV — calling profits on average given this estimate.' : 'Negative EV — folding is better on average given this estimate (ignoring implied odds).',
    whyAlternativesWrong: 'A common error is multiplying win% by only the ORIGINAL pot (forgetting your own call also becomes part of what you can win).',
    assumptions: 'Assumes no ties/split pots and no implied odds from future streets.',
  };
}

export function generateBetEvDrill(): Drill {
  const pot = randInt(3, 15) * 10;
  const bet = randInt(1, 10) * 10;
  const foldPct = randInt(20, 80);
  const winIfCalledPct = randInt(10, 60);
  const ev = evOfBet({ potBeforeBet: pot, betAmount: bet, foldProbability: foldPct / 100, winProbabilityIfCalled: winIfCalledPct / 100 });
  return {
    category: 'bet-ev-fold-equity',
    prompt: `Pot: ${pot}. You bet ${bet}. Opponent folds ${foldPct}% of the time; if they call, you win ${winIfCalledPct}% of the time. What is the EV of betting?`,
    answerKind: 'numeric',
    correctValue: Math.round(ev * 10) / 10,
    tolerance: Math.max(2, Math.abs(ev) * 0.1),
    unit: 'chips',
    calculationSteps: [
      'EV(bet) = P(fold)×pot + P(call)×[P(win|called)×(pot+2×bet) − P(lose|called)×bet]',
      `= ${foldPct}%×${pot} + ${100 - foldPct}%×[${winIfCalledPct}%×${pot + 2 * bet} − ${100 - winIfCalledPct}%×${bet}]`,
      `= ${ev.toFixed(1)}`,
    ],
    fastestMethod: 'Split into two branches (fold / called) and weight each by its own probability — don’t try to do it in one step.',
    interpretation: 'This blends fold equity (profit when they fold) with showdown equity (profit/loss when called) into one number.',
    whyAlternativesWrong: 'Ignoring fold equity entirely (only computing showdown EV) undervalues bets/bluffs that work by getting folds.',
    assumptions: 'Two-outcome simplification: no raises modeled, and win% if called is a single fixed estimate rather than a range breakdown.',
  };
}

export function generateCombinationsDrill(): Drill {
  const isPair = Math.random() < 0.5;
  if (isPair) {
    const known = randInt(0, 2);
    const remaining = 4 - known;
    return {
      category: 'combinations-blockers',
      prompt: `A specific pocket pair normally has 6 combinations. If ${known} of that rank are already visible (in your hand or the board), how many combinations remain?`,
      answerKind: 'numeric',
      correctValue: combinations(remaining, 2),
      tolerance: 0,
      calculationSteps: [`Remaining cards of that rank: 4 − ${known} = ${remaining}`, `Combinations = C(${remaining}, 2) = ${combinations(remaining, 2)}`],
      fastestMethod: 'Memorize: 4 left → 6 combos, 3 left → 3 combos, 2 left → 1 combo, 1 or 0 left → 0 combos.',
      interpretation: 'Blockers (cards you or the board hold) directly shrink the number of combos an opponent can hold of that hand.',
      whyAlternativesWrong: 'Forgetting to reduce the count when you hold or see one of the rank overstates how many pocket-pair combos are still possible.',
      assumptions: 'Assumes a standard single 52-card deck with no other constraints.',
    };
  }
  const rank1Left = randInt(2, 4);
  const rank2Left = randInt(2, 4);
  return {
    category: 'combinations-blockers',
    prompt: `An unpaired two-rank starting hand (e.g. AK) normally has 16 combinations. If ${4 - rank1Left} of the first rank and ${4 - rank2Left} of the second rank are already visible, how many combinations remain?`,
    answerKind: 'numeric',
    correctValue: rank1Left * rank2Left,
    tolerance: 0,
    calculationSteps: [`Remaining first-rank cards: ${rank1Left}`, `Remaining second-rank cards: ${rank2Left}`, `Combinations = ${rank1Left} × ${rank2Left} = ${rank1Left * rank2Left}`],
    fastestMethod: 'Unpaired combos = (cards left of rank A) × (cards left of rank B) — no division needed, unlike pairs.',
    interpretation: 'This is why holding one card of a key rank (a "blocker") meaningfully reduces specific combos an opponent can hold.',
    whyAlternativesWrong: 'Using the paired-hand formula (n choose 2) for an unpaired hand is a common mix-up — unpaired combos multiply, they don’t combine.',
    assumptions: 'Assumes a standard single 52-card deck with no other constraints.',
  };
}

const PREFLOP_QUESTIONS: Drill[] = [
  {
    category: 'preflop-decision',
    prompt: 'You are under the gun (first to act) with 7♥2♠ at a 6-handed table. Standard action?',
    answerKind: 'choice',
    choices: ['Raise', 'Call', 'Fold'],
    correctIndex: 2,
    calculationSteps: ['7-2 offsuit is the weakest hand in hold’em (lowest cards, no suit, no connection).', 'From the worst position with the least information, it’s a clear fold.'],
    fastestMethod: 'Recognize the classic "worst hand" pattern instantly — no calculation needed.',
    interpretation: 'Under the gun requires the tightest range at the table since the most players remain to act behind you.',
    whyAlternativesWrong: 'Raising or calling with the weakest possible hand from the worst position loses money over the long run regardless of short-term results.',
    assumptions: 'Assumes a standard full-ring cash game with no unusual reads or antes changing the math.',
  },
  {
    category: 'preflop-decision',
    prompt: 'You are on the button with A♥K♥ and everyone has folded to you. Standard action?',
    answerKind: 'choice',
    choices: ['Raise', 'Call (limp)', 'Fold'],
    correctIndex: 0,
    calculationSteps: ['AKs is a premium hand — a big pair-beating ace-high with flush potential.', 'From the button (best position, folded to you), this is a clear raise for value and initiative.'],
    fastestMethod: 'Premium hands from late position with no action in front: raise, virtually always.',
    interpretation: 'Raising here builds the pot with a strong hand while also taking advantage of positional and initiative advantages.',
    whyAlternativesWrong: 'Limping a premium hand gives up value and lets weaker hands see a cheap flop, reducing your edge.',
    assumptions: 'Assumes standard stack depths (not a very short stack, where shoving might be preferred).',
  },
  {
    category: 'preflop-decision',
    prompt: 'You are in the big blind with 9♣8♣ (suited connector) and one player limped in front of you. Standard action?',
    answerKind: 'choice',
    choices: ['Raise', 'Check', 'Fold'],
    correctIndex: 1,
    calculationSteps: ['You already have money in as the big blind, so checking costs nothing extra.', 'Suited connectors have decent multiway playability but aren’t strong enough to demand a raise here.'],
    fastestMethod: 'Free option in the BB with a speculative hand → default to checking unless there’s a specific reason to raise.',
    interpretation: 'The big blind’s free option is one of the few spots where "just see a flop cheaply" is often correct with speculative hands.',
    whyAlternativesWrong: 'Folding gives up a hand you’ve already paid for with no additional cost to continue; raising isn’t necessary with only a limper in.',
    assumptions: 'Assumes no other significant reads or unusual limper tendencies.',
  },
];

const STRATEGY_CONCEPT_QUESTIONS: Drill[] = [
  {
    category: 'strategy-concepts',
    prompt: 'On a dry, disconnected board (e.g. K♣7♣2♠), which player usually has the bigger range/nut advantage?',
    answerKind: 'choice',
    choices: ['The preflop aggressor', 'The preflop caller', 'Neither — always equal'],
    correctIndex: 0,
    calculationSteps: ['The preflop raiser’s range contains more big pairs and big aces, which connect well with a King-high dry board.', 'The caller’s range is usually more capped (fewer very strong hands) on this kind of texture.'],
    fastestMethod: 'Dry, high-card boards generally favor the preflop aggressor’s range.',
    interpretation: 'This is exactly why continuation betting is profitable more often on boards like this than on wet, low, coordinated ones.',
    whyAlternativesWrong: 'Assuming ranges are always symmetric ignores how preflop raising itself already filters each player’s likely holdings.',
    assumptions: 'Assumes standard preflop opening ranges without unusual preflop action (like a 3-bet pot, which shifts things further).',
  },
  {
    category: 'strategy-concepts',
    prompt: 'What does Minimum Defence Frequency (MDF) describe?',
    answerKind: 'choice',
    choices: [
      'The minimum % of your range you must continue with vs a bet so the bettor can’t auto-profit by bluffing every hand',
      'The minimum bet size allowed by the rules',
      'The minimum number of outs needed to call',
    ],
    correctIndex: 0,
    calculationSteps: ['MDF = pot ÷ (pot + bet).', 'If you fold MORE than (1 − MDF) of your range, a bettor can profitably bluff with any two cards.'],
    fastestMethod: 'MDF is just "pot / (pot+bet)" — the same shape as pot odds, from the other player’s seat.',
    interpretation: 'It’s a defensive baseline for balance, not a claim that any specific hand must call.',
    whyAlternativesWrong: 'MDF is about range-wide defense frequency, not about a rule-based minimum bet size or a fixed outs requirement.',
    assumptions: 'Assumes the bettor is capable of representing the nuts and bluffing believably on this exact line — not always true against weak/passive opponents.',
  },
  {
    category: 'strategy-concepts',
    prompt: 'What is a "blocker" most precisely?',
    answerKind: 'choice',
    choices: [
      'A card in your hand that reduces the combos of a specific hand your opponent can hold',
      'A card that physically blocks the dealer from dealing',
      'Any card higher than a Jack',
    ],
    correctIndex: 0,
    calculationSteps: ['Holding a specific card removes it from the deck the opponent could have used.', 'This changes (usually reduces) how many combos of a given holding remain possible for them.'],
    fastestMethod: 'Ask: "does my card remove combos of their likely nut hands or bluffs?"',
    interpretation: 'Blockers matter most on later streets and bigger bets, where the exact combo count meaningfully shifts the math of a call/bluff.',
    whyAlternativesWrong: 'This is a card-removal concept, unrelated to card rank alone or to any physical dealing rule.',
    assumptions: 'Assumes single-deck standard rules with full information about which cards are visible/used.',
  },
];

const GENERATORS: Record<Exclude<DrillCategory, 'preflop-decision' | 'strategy-concepts'>, () => Drill> = {
  'hand-ranking': generateHandRankingDrill,
  'best-five': generateBestFiveDrill,
  outs: generateOutsDrill,
  'draw-probability': generateDrawProbabilityDrill,
  'pot-odds': generatePotOddsDrill,
  'call-ev': generateCallEvDrill,
  'bet-ev-fold-equity': generateBetEvDrill,
  'combinations-blockers': generateCombinationsDrill,
  'bet-sizing': generateBetSizingDrill,
};

export function generateBetSizingDrill(): Drill {
  const pot = randInt(4, 20) * 10;
  const preset = pick(['third', 'half', 'twoThirds', 'pot'] as const);
  const fractions = { third: 1 / 3, half: 1 / 2, twoThirds: 2 / 3, pot: 1 };
  const answer = Math.round(pot * fractions[preset]);
  const label = { third: '1/3 pot', half: '1/2 pot', twoThirds: '2/3 pot', pot: 'pot-sized' }[preset];
  return {
    category: 'bet-sizing',
    prompt: `The pot is ${pot}. What is a ${label} bet?`,
    answerKind: 'numeric',
    correctValue: answer,
    tolerance: Math.max(1, pot * 0.02),
    unit: 'chips',
    calculationSteps: [`${label} of ${pot} = ${pot} × ${fractions[preset].toFixed(2)}`, `= ${answer}`],
    fastestMethod: 'Round pot to a clean number mentally, then apply the simple fraction.',
    interpretation: 'Bet-size presets are shorthand for "how much of the pot am I risking/offering" — useful for quick sizing decisions at the table.',
    whyAlternativesWrong: 'Confusing pot-sized with "pot plus your call" (the total pot AFTER a raise) is a common sizing mix-up.',
    assumptions: 'Assumes the stack is deep enough to make this size, and ignores any minimum-bet/raise constraints.',
  };
}

export function generateDrill(category: DrillCategory): Drill {
  if (category === 'preflop-decision') return pick(PREFLOP_QUESTIONS);
  if (category === 'strategy-concepts') return pick(STRATEGY_CONCEPT_QUESTIONS);
  return GENERATORS[category]();
}

export const ALL_CATEGORIES: { id: DrillCategory; label: string }[] = [
  { id: 'hand-ranking', label: 'Hand Rankings' },
  { id: 'best-five', label: 'Best-Five-Card Identification' },
  { id: 'outs', label: 'Counting Outs' },
  { id: 'draw-probability', label: 'Draw Probabilities' },
  { id: 'pot-odds', label: 'Pot Odds / Required Equity' },
  { id: 'call-ev', label: 'Call EV' },
  { id: 'bet-ev-fold-equity', label: 'Bet EV / Fold Equity' },
  { id: 'combinations-blockers', label: 'Combinations & Blockers' },
  { id: 'preflop-decision', label: 'Preflop Decisions' },
  { id: 'bet-sizing', label: 'Bet Sizing' },
  { id: 'strategy-concepts', label: 'Strategy Concepts (board texture, MDF, blockers, ranges)' },
];
