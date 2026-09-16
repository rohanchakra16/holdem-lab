import { LegalActions, Player, TableState } from './types';

/**
 * Computes the legal actions for the player currently on the acting seat.
 * Pure function of the public table state — used both to drive the UI and
 * to validate every action before it is applied.
 */
export function computeLegalActions(state: TableState): LegalActions {
  const seat = state.actingSeat;
  if (seat === null) {
    return { canFold: false, canCheck: false, canCall: false, callAmount: 0, canBetOrRaise: false, minRaiseTo: 0, maxRaiseTo: 0, raiseIsAllInOnly: false };
  }
  const player = state.players.find((p) => p.seat === seat)!;
  return computeLegalActionsForPlayer(state, player);
}

export function computeLegalActionsForPlayer(state: TableState, player: Player): LegalActions {
  if (player.hasFolded || player.isAllIn || !player.isActive) {
    return { canFold: false, canCheck: false, canCall: false, callAmount: 0, canBetOrRaise: false, minRaiseTo: 0, maxRaiseTo: 0, raiseIsAllInOnly: false };
  }

  const toCall = state.currentBet - player.committedThisStreet;
  const callAmount = Math.min(toCall, player.stack);
  const canCheck = toCall <= 0;
  const canCall = toCall > 0 && player.stack > 0;

  const isCapped = state.cappedFromReraising.includes(player.id);
  const effectiveStack = player.stack; // chips behind, not yet committed this street
  const maxRaiseTo = player.committedThisStreet + effectiveStack; // full shove total
  const minRaiseIncrement = state.lastRaiseAmount || state.config.bigBlind;
  const minRaiseTo = state.currentBet + minRaiseIncrement;

  const canGoAllIn = effectiveStack > 0;
  const canBetOrRaise = !isCapped && canGoAllIn && maxRaiseTo > state.currentBet;
  const raiseIsAllInOnly = canBetOrRaise && maxRaiseTo < minRaiseTo;

  return {
    canFold: true,
    canCheck,
    canCall,
    callAmount,
    canBetOrRaise,
    minRaiseTo: Math.min(minRaiseTo, maxRaiseTo),
    maxRaiseTo,
    raiseIsAllInOnly,
  };
}
