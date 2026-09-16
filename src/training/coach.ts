import { Player, PlayerAction, TableState } from '../engine/types';
import { computeLegalActionsForPlayer } from '../engine/legalActions';
import { requiredEquityToCall, stackToPotRatio } from '../math/potOdds';
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
