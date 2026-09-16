import { Card } from '../engine/cards';
import { equityVsRandomHands } from '../math/equity';
import { computeLegalActionsForPlayer } from '../engine/legalActions';
import { BotPersonality, LegalActions, Player, PlayerAction, TableState } from '../engine/types';
import { RNG } from '../engine/rng';

/**
 * Everything a bot is legally allowed to see. Deliberately excludes other
 * players' hole cards, folded players' hole cards, and any future
 * (undealt) community cards — enforced by construction: this object is
 * built from the public TableState plus only the bot's own hole cards.
 */
export interface BotObservation {
  seat: number;
  holeCards: Card[];
  community: Card[];
  pot: number;
  currentBet: number;
  committedThisStreet: number;
  stack: number;
  street: TableState['street'];
  numActiveOpponents: number;
  legal: LegalActions;
  personality: BotPersonality;
  rng: RNG;
}

export function buildObservation(state: TableState, player: Player, potBefore: number, rng: RNG): BotObservation {
  const legal = computeLegalActionsForPlayer(state, player);
  const numActiveOpponents = state.players.filter((p) => p.seat !== player.seat && p.isActive && !p.hasFolded).length;
  return {
    seat: player.seat,
    holeCards: player.holeCards,
    community: state.community,
    pot: potBefore,
    currentBet: state.currentBet,
    committedThisStreet: player.committedThisStreet,
    stack: player.stack,
    street: state.street,
    numActiveOpponents,
    legal,
    personality: player.personality ?? 'balanced-advanced',
    rng,
  };
}

interface PersonalityParams {
  aggression: number; // 0-1, likelihood of betting/raising with a strong hand instead of just calling
  looseness: number; // 0-1, willingness to continue with weaker hands
  bluffFrequency: number; // 0-1, chance of bluffing/semi-bluffing with a weak hand
  callThreshold: number; // minimum hand strength (0-1) to continue facing a bet
}

const PERSONALITY_PARAMS: Record<BotPersonality, PersonalityParams> = {
  'tight-passive': { aggression: 0.15, looseness: 0.2, bluffFrequency: 0.03, callThreshold: 0.55 },
  'loose-passive': { aggression: 0.2, looseness: 0.7, bluffFrequency: 0.08, callThreshold: 0.3 },
  'tight-aggressive': { aggression: 0.65, looseness: 0.3, bluffFrequency: 0.15, callThreshold: 0.5 },
  'loose-aggressive': { aggression: 0.75, looseness: 0.75, bluffFrequency: 0.3, callThreshold: 0.35 },
  'balanced-advanced': { aggression: 0.5, looseness: 0.45, bluffFrequency: 0.22, callThreshold: 0.42 },
};

/** Cheap heuristic hand-strength estimate (0-1) using Monte Carlo equity vs a random hand. */
function estimateStrength(obs: BotObservation): number {
  if (obs.community.length === 0) {
    return preflopHeuristicStrength(obs.holeCards);
  }
  const result = equityVsRandomHands(obs.holeCards, obs.community, Math.max(1, obs.numActiveOpponents), 150, obs.rng);
  return result.winRate + result.tieRate * 0.5;
}

function preflopHeuristicStrength(hole: Card[]): number {
  const [a, b] = [...hole].sort((x, y) => y.rank - x.rank);
  const isPair = a.rank === b.rank;
  const isSuited = a.suit === b.suit;
  const gap = a.rank - b.rank;
  let score = (a.rank + b.rank) / 28; // normalize roughly 0-1 (2+2=4 low, 14+14=28 high)
  if (isPair) score += 0.25 + a.rank / 60;
  if (isSuited) score += 0.06;
  if (!isPair && gap <= 1) score += 0.04;
  else if (!isPair && gap >= 4) score -= 0.08;
  return Math.max(0.05, Math.min(0.99, score));
}

function raiseSize(obs: BotObservation, pot: number): number {
  const { legal } = obs;
  const potSizedTo = obs.currentBet + Math.round(pot * 0.66);
  const target = Math.max(legal.minRaiseTo, Math.min(potSizedTo, legal.maxRaiseTo));
  return target;
}

/**
 * Chooses a legal action for a bot given only its lawful observation of the
 * table. Never inspects TableState directly — everything it needs travels
 * through BotObservation, which is the enforcement point for the
 * information boundary tested in botInformationBoundary.test.ts.
 */
export function decideBotAction(obs: BotObservation): PlayerAction {
  const params = PERSONALITY_PARAMS[obs.personality];
  const strength = estimateStrength(obs);
  const facingBet = obs.legal.canCall;
  const roll = obs.rng();

  if (!facingBet) {
    // Can check: decide whether to bet for value, bluff, or check.
    const wantsToValueBet = strength > 0.6 && roll < params.aggression;
    const wantsToBluff = strength < 0.35 && roll < params.bluffFrequency;
    if ((wantsToValueBet || wantsToBluff) && obs.legal.canBetOrRaise) {
      return { type: 'bet', amount: raiseSize(obs, obs.pot) };
    }
    return { type: 'check' };
  }

  // Facing a bet/raise: fold, call, or raise based on strength + personality.
  const adjustedThreshold = params.callThreshold * (1 - params.looseness * 0.3);
  if (strength < adjustedThreshold * 0.5 && roll > params.bluffFrequency) {
    return obs.legal.canFold ? { type: 'fold' } : { type: 'call' };
  }
  if (strength > 0.75 && roll < params.aggression && obs.legal.canBetOrRaise) {
    return obs.legal.raiseIsAllInOnly ? { type: 'all-in' } : { type: 'raise', amount: raiseSize(obs, obs.pot) };
  }
  if (strength >= adjustedThreshold) {
    return { type: 'call' };
  }
  // Occasional bluff-raise with a weak hand, otherwise fold.
  if (roll < params.bluffFrequency && obs.legal.canBetOrRaise) {
    return obs.legal.raiseIsAllInOnly ? { type: 'all-in' } : { type: 'raise', amount: raiseSize(obs, obs.pot) };
  }
  return obs.legal.canFold ? { type: 'fold' } : { type: 'call' };
}
