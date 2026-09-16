import { Card } from './cards';
import { HandValue } from './handEvaluator';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';

export interface PlayerAction {
  type: ActionType;
  /** Total chip amount put in for this action (for bet/raise/call/all-in). Absent for fold/check. */
  amount?: number;
}

export type BotPersonality =
  | 'tight-passive'
  | 'loose-passive'
  | 'tight-aggressive'
  | 'loose-aggressive'
  | 'balanced-advanced';

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  personality?: BotPersonality;
  stack: number;
  holeCards: Card[];
  /** Chips committed to the pot in the current betting round. */
  committedThisStreet: number;
  /** Total chips committed to the pot across the whole hand. */
  committedTotal: number;
  hasFolded: boolean;
  isAllIn: boolean;
  /** False once a player busts out of the session (stack = 0 and not in current hand). */
  isActive: boolean;
  seat: number;
}

export interface ActionRecord {
  playerId: string;
  street: Street;
  action: PlayerAction;
  /** Pot size before this action, for later review/explanation. */
  potBefore: number;
  stackBefore: number;
}

export interface SidePot {
  amount: number;
  /** Player ids eligible to win this pot. */
  eligiblePlayerIds: string[];
}

export interface TableConfig {
  smallBlind: number;
  bigBlind: number;
  startingStack: number;
}

export interface TableState {
  players: Player[];
  /** Seat index of the dealer button. */
  buttonSeat: number;
  community: Card[];
  street: Street;
  pots: SidePot[];
  /** Highest total committedThisStreet among active players in the current round. */
  currentBet: number;
  /** The size of the last bet/raise increment, for minimum-raise enforcement. */
  lastRaiseAmount: number;
  /** Seat index whose turn it is to act, or null if the round/hand is over. */
  actingSeat: number | null;
  /** Seat that made the last aggressive action this round (bet/raise); action closes when it comes back around to here having only calls/checks after. */
  lastAggressorSeat: number | null;
  /** Player ids who have had at least one turn to act since the current bet level was set. */
  actedThisRound: string[];
  /** Player ids who may only call or fold this round because a short (non-full) all-in raise does not reopen the betting for them. */
  cappedFromReraising: string[];
  /** Whether the most recent bet/raise met the full minimum-raise size (false for an under-sized all-in raise). */
  lastRaiseWasFullRaise: boolean;
  config: TableConfig;
  actionHistory: ActionRecord[];
  showdownResults: ShowdownResult[] | null;
  handNumber: number;
  isHandComplete: boolean;
}

export interface ShowdownResult {
  playerId: string;
  handValue: HandValue | null; // null if folded before showdown
  amountWon: number;
}

export interface LegalActions {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canBetOrRaise: boolean;
  minRaiseTo: number;
  maxRaiseTo: number;
  /** True if betting/raising must be all-in only (not enough behind for a full min-raise). */
  raiseIsAllInOnly: boolean;
}
