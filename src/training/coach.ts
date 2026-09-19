import { Player, PlayerAction, Street, TableState } from '../engine/types';
import { computeLegalActionsForPlayer } from '../engine/legalActions';
import { requiredEquityToCall, stackToPotRatio, betSizeFromPreset } from '../math/potOdds';
import { evOfCall } from '../math/ev';
import { equityVsRandomHands } from '../math/equity';
import { mulberry32 } from '../engine/rng';
import { getTotalPot } from '../engine/engine';

export interface CoachFeedback {
  isLegal: boolean;
  assessment: string;
  potBefore: number;
  callAmount: number;
  requiredEquity: number | null;
  estimatedEquity: number | null; // simulation-based estimate, vs random remaining hands
  evOfCalling: number | null;
  positionNote: string;
  effectiveStack: number;
  stackToPotRatio: number;
  lesson: string;
  isImportantDecision: boolean;
  outcomeNote: string;
}

/** A hero decision's numbers, recorded permanently into hand history regardless of live coaching settings. */
export interface HeroDecisionRecord {
  street: Street;
  action: PlayerAction;
  requiredEquity: number | null;
  estimatedEquity: number | null;
  evOfCalling: number | null;
  assessment: string;
}

interface DecisionMetrics {
  potBefore: number;
  callAmount: number;
  requiredEquity: number | null;
  estimatedEquity: number | null;
  evOfCalling: number | null;
  opponents: number;
  effectiveStack: number;
  spr: number;
}

function positionLabel(state: TableState, player: Player): string {
  const active = state.players.filter((p) => p.isActive && !p.hasFolded);
  const n = active.length;
  const distanceFromButtonToAct = ((player.seat - state.buttonSeat + state.players.length) % state.players.length);
  if (n <= 2) return distanceFromButtonToAct === 0 ? 'Button / Small Blind (heads-up)' : 'Big Blind (heads-up)';
  if (distanceFromButtonToAct === 0) return 'Button';
  if (distanceFromButtonToAct === 1) return 'Small Blind';
  if (distanceFromButtonToAct === 2) return 'Big Blind';
  if (distanceFromButtonToAct === n - 1) return 'Cutoff';
  return 'Middle Position';
}

/** The exact-math + simulation-estimate numbers for a decision point, independent of what action is (or will be) taken. */
function computeDecisionMetrics(state: TableState, player: Player, seed: number): DecisionMetrics {
  const legal = computeLegalActionsForPlayer(state, player);
  const potBefore = getTotalPot(state);
  const callAmount = legal.callAmount;
  const requiredEquity = callAmount > 0 ? requiredEquityToCall(potBefore, callAmount) : null;

  const opponents = state.players.filter((p) => p.seat !== player.seat && p.isActive && !p.hasFolded).length;
  let estimatedEquity: number | null = null;
  try {
    if (opponents > 0) {
      const result = equityVsRandomHands(player.holeCards, state.community, opponents, 800, mulberry32(seed));
      estimatedEquity = result.winRate + result.tieRate * 0.5;
    }
  } catch {
    estimatedEquity = null;
  }

  const evOfCalling =
    callAmount > 0 && estimatedEquity !== null
      ? evOfCall({ potBeforeCall: potBefore, callAmount, winProbability: estimatedEquity })
      : null;

  const effectiveStack = player.stack + player.committedThisStreet;
  const spr = stackToPotRatio(effectiveStack, Math.max(1, potBefore));

  return { potBefore, callAmount, requiredEquity, estimatedEquity, evOfCalling, opponents, effectiveStack, spr };
}

/**
 * Builds coaching feedback for a human decision using ONLY information
 * available at the time of the decision (current board, no future cards,
 * no opponents' hole cards). Equity is always a simulation-based ESTIMATE
 * vs random remaining hands, clearly labelled as such, not solved
 * range-vs-range equity.
 */
export function buildCoachFeedback(state: TableState, player: Player, action: PlayerAction, seed: number): CoachFeedback {
  const legal = computeLegalActionsForPlayer(state, player);
  let isLegal = true;
  switch (action.type) {
    case 'fold': isLegal = legal.canFold; break;
    case 'check': isLegal = legal.canCheck; break;
    case 'call': isLegal = legal.canCall; break;
    case 'bet': case 'raise': case 'all-in': isLegal = legal.canBetOrRaise; break;
  }

  const { potBefore, callAmount, requiredEquity, estimatedEquity, evOfCalling, opponents, effectiveStack, spr } = computeDecisionMetrics(
    state,
    player,
    seed
  );

  let assessment = '';
  let lesson = '';
  let isImportantDecision = false;

  if (!isLegal) {
    assessment = 'That action was not legal in this spot — the engine will not apply it.';
  } else if (action.type === 'fold') {
    assessment =
      requiredEquity !== null
        ? `You folded facing a ${(requiredEquity * 100).toFixed(1)}% required-equity call. That's a defensible choice if you estimated less equity than that.`
        : 'You folded with no bet to face — usually only relevant when checking was available and free.';
    lesson = 'Folding costs nothing extra beyond what is already in the pot — the only question is whether your equity clears the pot-odds bar.';
  } else if (action.type === 'call') {
    if (requiredEquity !== null && estimatedEquity !== null) {
      isImportantDecision = Math.abs(estimatedEquity - requiredEquity) < 0.06 || potBefore + callAmount > effectiveStack * 0.6;
      assessment =
        estimatedEquity >= requiredEquity
          ? `Calling needed ${(requiredEquity * 100).toFixed(1)}% equity; your estimated equity (${(estimatedEquity * 100).toFixed(1)}%) clears that bar.`
          : `Calling needed ${(requiredEquity * 100).toFixed(1)}% equity; your estimated equity (${(estimatedEquity * 100).toFixed(1)}%) falls short on a pure pot-odds basis (implied odds could still justify it with strong draws).`;
    } else {
      assessment = 'You called (no bet was actually owed, so this behaves like a check).';
    }
    lesson = 'Compare your estimated equity against the pot-odds break-even line; implied odds can justify calling below that line with strong draws.';
  } else if (action.type === 'check') {
    assessment = 'You checked, keeping the pot small and staying in without extra risk.';
    lesson = 'Checking is free information gathering — useful when your hand does not want to build a big pot yet, or as a trap/pot-control play.';
  } else {
    isImportantDecision = true;
    assessment =
      estimatedEquity !== null
        ? `You bet/raised with an estimated ${(estimatedEquity * 100).toFixed(1)}% equity against ${opponents} opponent(s) if checked down. This is a strategic (fold-equity + value) decision, not purely a pot-odds one.`
        : 'You bet/raised.';
    lesson =
      'Betting for value wants a hand ahead of what calls; bluffing wants enough fold equity to make up for the times you get called. Consider both value and bluff combos on this line for balance.';
  }

  const outcomeNote =
    'This assessment is based only on information available at the time of your decision. The actual result of the hand (who wins, and by how much) is driven partly by variance — a correct decision can still lose, and a mistake can still win. Judge the decision, not the outcome.';

  return {
    isLegal,
    assessment,
    potBefore,
    callAmount,
    requiredEquity,
    estimatedEquity,
    evOfCalling,
    positionNote: positionLabel(state, player),
    effectiveStack,
    stackToPotRatio: spr,
    lesson,
    isImportantDecision,
    outcomeNote,
  };
}

/** Converts feedback for whatever action the hero actually took into a permanent hand-history record. */
export function toHeroDecisionRecord(street: Street, action: PlayerAction, feedback: CoachFeedback): HeroDecisionRecord {
  return {
    street,
    action,
    requiredEquity: feedback.requiredEquity,
    estimatedEquity: feedback.estimatedEquity,
    evOfCalling: feedback.evOfCalling,
    assessment: feedback.assessment,
  };
}

export interface ActionSuggestion {
  action: PlayerAction;
  label: string;
  reasoning: string;
  requiredEquity: number | null;
  estimatedEquity: number | null;
}

/**
 * A heuristic, opt-in "what would a pot-odds/equity-only approach do here"
 * suggestion, computed BEFORE the hero acts. This is deliberately simple —
 * it only ever reasons from required vs. estimated equity, the same two
 * numbers shown in feedback afterwards — so it never sees anything the
 * player couldn't also see, and it is explicitly not a solver: it ignores
 * implied odds, opponent tendencies, and multi-street planning. Off by
 * default; the player must turn it on.
 */
export function suggestAction(state: TableState, player: Player, seed: number): ActionSuggestion {
  const legal = computeLegalActionsForPlayer(state, player);
  const { potBefore, requiredEquity, estimatedEquity } = computeDecisionMetrics(state, player, seed);
  const equity = estimatedEquity ?? 0;

  if (!legal.canCall && !legal.canCheck) {
    // Only fold is legal (e.g. already all-in elsewhere) — nothing to suggest.
    return {
      action: { type: 'fold' },
      label: 'Fold',
      reasoning: 'No other legal action is available here.',
      requiredEquity,
      estimatedEquity,
    };
  }

  if (legal.canCheck) {
    if (equity >= 0.62 && legal.canBetOrRaise) {
      const amount = Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, betSizeFromPreset('twoThirds', potBefore, legal.maxRaiseTo)));
      return {
        action: { type: 'bet', amount },
        label: `Bet to ${amount}`,
        reasoning: `Estimated equity (${(equity * 100).toFixed(0)}%) is strong enough vs this many opponents to bet for value — a two-thirds-pot sizing is a reasonable default.`,
        requiredEquity,
        estimatedEquity,
      };
    }
    return {
      action: { type: 'check' },
      label: 'Check',
      reasoning:
        equity >= 0.62
          ? 'Equity looks strong, but betting/raising is not available here — checking is the only legal way forward.'
          : `Estimated equity (${(equity * 100).toFixed(0)}%) isn't clearly ahead enough to build the pot for free — checking keeps it small.`,
      requiredEquity,
      estimatedEquity,
    };
  }

  // Facing a bet.
  const required = requiredEquity ?? 0;
  if (equity < required) {
    return {
      action: { type: 'fold' },
      label: 'Fold',
      reasoning: `Estimated equity (${(equity * 100).toFixed(0)}%) is below the ${(required * 100).toFixed(0)}% pot odds require. Only a fold-equity or implied-odds read this simple check can't see would change that.`,
      requiredEquity,
      estimatedEquity,
    };
  }
  if (equity > required + 0.2 && legal.canBetOrRaise) {
    const amount = legal.raiseIsAllInOnly
      ? legal.maxRaiseTo
      : Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, state.currentBet + betSizeFromPreset('twoThirds', potBefore, legal.maxRaiseTo)));
    return {
      action: legal.raiseIsAllInOnly ? { type: 'all-in' } : { type: 'raise', amount },
      label: legal.raiseIsAllInOnly ? `All-in ${amount}` : `Raise to ${amount}`,
      reasoning: `Estimated equity (${(equity * 100).toFixed(0)}%) clears the ${(required * 100).toFixed(0)}% requirement by a wide margin — raising builds the pot with the better hand, though calling is also defensible.`,
      requiredEquity,
      estimatedEquity,
    };
  }
  return {
    action: { type: 'call' },
    label: 'Call',
    reasoning: `Estimated equity (${(equity * 100).toFixed(0)}%) clears the ${(required * 100).toFixed(0)}% pot odds require.`,
    requiredEquity,
    estimatedEquity,
  };
}

export { betSizeFromPreset as _unused_keep_import };
