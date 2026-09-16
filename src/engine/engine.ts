import { Deck } from './deck';
import { compareHandValues, evaluateBest } from './handEvaluator';
import { computeLegalActionsForPlayer } from './legalActions';
import { calculateSidePots, splitPotAmount } from './potManager';
import { createRng, RNG } from './rng';
import {
  ActionRecord,
  BotPersonality,
  Player,
  PlayerAction,
  ShowdownResult,
  Street,
  TableConfig,
  TableState,
} from './types';

export interface PlayerSetup {
  id: string;
  name: string;
  isHuman: boolean;
  personality?: BotPersonality;
}

export class DevelopmentError extends Error {}

function totalPot(state: TableState): number {
  return state.players.reduce((sum, p) => sum + p.committedTotal, 0);
}

/** Deterministic, well-tested no-limit hold'em hand/session engine. */
export class HandEngine {
  state: TableState;
  private deck: Deck | null = null;
  private rng: RNG;

  constructor(config: TableConfig, playerSetups: PlayerSetup[], seed?: number) {
    if (playerSetups.length < 2 || playerSetups.length > 9) {
      throw new DevelopmentError('HandEngine requires between 2 and 9 players');
    }
    const { rng } = createRng(seed);
    this.rng = rng;
    const players: Player[] = playerSetups.map((setup, seat) => ({
      id: setup.id,
      name: setup.name,
      isHuman: setup.isHuman,
      personality: setup.personality,
      stack: config.startingStack,
      holeCards: [],
      committedThisStreet: 0,
      committedTotal: 0,
      hasFolded: false,
      isAllIn: false,
      isActive: true,
      seat,
    }));
    this.state = {
      players,
      buttonSeat: players.length - 1, // so the first startHand() makes seat 0 the button
      community: [],
      street: 'preflop',
      pots: [],
      currentBet: 0,
      lastRaiseAmount: config.bigBlind,
      actingSeat: null,
      lastAggressorSeat: null,
      actedThisRound: [],
      cappedFromReraising: [],
      lastRaiseWasFullRaise: true,
      config,
      actionHistory: [],
      showdownResults: null,
      handNumber: 0,
      isHandComplete: true,
    };
  }

  /** Returns a structurally-shared snapshot suitable for UI consumption or serialization. */
  getState(): TableState {
    return this.state;
  }

  private activePlayers(): Player[] {
    return this.state.players.filter((p) => p.isActive);
  }

  private nextSeat(fromSeat: number, predicate: (p: Player) => boolean): number | null {
    const n = this.state.players.length;
    for (let i = 1; i <= n; i++) {
      const seat = (fromSeat + i) % n;
      const player = this.state.players.find((p) => p.seat === seat);
      if (player && predicate(player)) return seat;
    }
    return null;
  }

  private nextButtonEligible(fromSeat: number): number | null {
    return this.nextSeat(fromSeat, (p) => p.isActive);
  }

  private nextToAct(fromSeat: number): number | null {
    return this.nextSeat(fromSeat, (p) => p.isActive && !p.hasFolded && !p.isAllIn);
  }

  startHand(): void {
    if (!this.state.isHandComplete) {
      throw new DevelopmentError('Cannot start a new hand while the previous hand is still in progress');
    }
    const active = this.activePlayers();
    if (active.length < 2) {
      throw new DevelopmentError('At least 2 active players with chips are required to start a hand');
    }

    for (const p of this.state.players) {
      p.holeCards = [];
      p.committedThisStreet = 0;
      p.committedTotal = 0;
      p.hasFolded = !p.isActive;
      p.isAllIn = false;
    }

    const newButton = this.nextButtonEligible(this.state.buttonSeat);
    if (newButton === null) throw new DevelopmentError('Could not find a seat for the dealer button');
    this.state.buttonSeat = newButton;
    this.state.community = [];
    this.state.street = 'preflop';
    this.state.pots = [];
    this.state.actionHistory = [];
    this.state.showdownResults = null;
    this.state.handNumber += 1;
    this.state.isHandComplete = false;
    this.state.actedThisRound = [];
    this.state.cappedFromReraising = [];
    this.state.lastRaiseWasFullRaise = true;
    this.state.lastRaiseAmount = this.state.config.bigBlind;

    this.deck = new Deck(this.rng);
    for (const p of this.state.players) {
      if (p.isActive) p.holeCards = this.deck.drawMany(2);
    }

    const isHeadsUp = active.length === 2;
    const sbSeat = isHeadsUp ? this.state.buttonSeat : this.nextButtonEligible(this.state.buttonSeat)!;
    const bbSeat = this.nextButtonEligible(sbSeat)!;

    const sbPlayer = this.state.players.find((p) => p.seat === sbSeat)!;
    const bbPlayer = this.state.players.find((p) => p.seat === bbSeat)!;
    this.postBlind(sbPlayer, this.state.config.smallBlind);
    this.postBlind(bbPlayer, this.state.config.bigBlind);
    this.state.currentBet = bbPlayer.committedThisStreet;

    const firstToAct = isHeadsUp ? this.state.buttonSeat : this.nextToAct(bbSeat);
    this.state.actingSeat = firstToAct;
    this.maybeSkipToResolution();
  }

  private postBlind(player: Player, amount: number): void {
    const posted = Math.min(amount, player.stack);
    player.stack -= posted;
    player.committedThisStreet += posted;
    player.committedTotal += posted;
    if (player.stack === 0) player.isAllIn = true;
  }

  getLegalActionsFor(playerId: string) {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.actingSeat !== player.seat) {
      return computeLegalActionsForPlayer(this.state, { ...player!, hasFolded: true });
    }
    return computeLegalActionsForPlayer(this.state, player);
  }

  applyAction(playerId: string, action: PlayerAction): void {
    if (this.state.isHandComplete) throw new DevelopmentError('Hand is already complete');
    const seat = this.state.actingSeat;
    if (seat === null) throw new DevelopmentError('No player is currently on turn');
    const player = this.state.players.find((p) => p.seat === seat)!;
    if (player.id !== playerId) {
      throw new DevelopmentError(`It is not ${playerId}'s turn (seat ${seat} / ${player.id} is acting)`);
    }
    const legal = computeLegalActionsForPlayer(this.state, player);
    const potBefore = totalPot(this.state);
    const stackBefore = player.stack;

    switch (action.type) {
      case 'fold': {
        if (!legal.canFold) throw new DevelopmentError('Fold is not legal here');
        player.hasFolded = true;
        this.markActed(player.id);
        break;
      }
      case 'check': {
        if (!legal.canCheck) throw new DevelopmentError('Check is not legal here: there is a bet to call');
        this.markActed(player.id);
        break;
      }
      case 'call': {
        if (!legal.canCall) throw new DevelopmentError('Call is not legal here');
        const amt = legal.callAmount;
        player.stack -= amt;
        player.committedThisStreet += amt;
        player.committedTotal += amt;
        if (player.stack === 0) player.isAllIn = true;
        this.markActed(player.id);
        break;
      }
      case 'bet':
      case 'raise':
      case 'all-in': {
        if (!legal.canBetOrRaise) throw new DevelopmentError('Betting/raising is not legal here');
        const amountTo = action.type === 'all-in' ? legal.maxRaiseTo : action.amount;
        if (amountTo === undefined) throw new DevelopmentError('Bet/raise requires an amount');
        if (amountTo > legal.maxRaiseTo) throw new DevelopmentError('Bet/raise exceeds available stack');
        if (legal.raiseIsAllInOnly) {
          if (amountTo !== legal.maxRaiseTo) throw new DevelopmentError('Only an all-in shove is legal for this short raise');
        } else if (amountTo < legal.minRaiseTo) {
          throw new DevelopmentError(`Raise must be at least ${legal.minRaiseTo}`);
        }
        const previousBet = this.state.currentBet;
        const delta = amountTo - player.committedThisStreet;
        player.stack -= delta;
        player.committedThisStreet = amountTo;
        player.committedTotal += delta;
        if (player.stack === 0) player.isAllIn = true;

        const raiseIncrement = amountTo - previousBet;
        const wasFullRaise = raiseIncrement >= this.state.lastRaiseAmount;
        if (wasFullRaise) {
          this.state.lastRaiseAmount = raiseIncrement;
          this.state.lastRaiseWasFullRaise = true;
          this.state.cappedFromReraising = [];
        } else {
          this.state.cappedFromReraising = [...this.state.actedThisRound];
          this.state.lastRaiseWasFullRaise = false;
        }
        this.state.currentBet = amountTo;
        this.state.actedThisRound = [player.id];
        break;
      }
    }

    const record: ActionRecord = { playerId: player.id, street: this.state.street, action, potBefore, stackBefore };
    this.state.actionHistory.push(record);

    this.advance();
  }

  private markActed(playerId: string): void {
    if (!this.state.actedThisRound.includes(playerId)) this.state.actedThisRound.push(playerId);
  }

  private contestants(): Player[] {
    return this.state.players.filter((p) => p.isActive && !p.hasFolded);
  }

  private isRoundClosed(): boolean {
    const contestants = this.contestants();
    if (contestants.length <= 1) return true;
    const canAct = contestants.filter((p) => !p.isAllIn);
    if (canAct.length === 0) return true;
    return canAct.every((p) => this.state.actedThisRound.includes(p.id) && p.committedThisStreet === this.state.currentBet);
  }

  private advance(): void {
    const contestants = this.contestants();
    if (contestants.length <= 1) {
      this.resolveByFold(contestants[0] ?? null);
      return;
    }
    if (this.isRoundClosed()) {
      if (this.state.street === 'river') {
        this.resolveShowdown();
        return;
      }
      const canActCount = contestants.filter((p) => !p.isAllIn).length;
      if (canActCount <= 1) {
        this.runOutRemainingStreets();
        this.resolveShowdown();
        return;
      }
      this.advanceStreet();
      return;
    }
    const next = this.nextToAct(this.state.actingSeat!);
    if (next === null) throw new DevelopmentError('Round not closed but no eligible player found to act next');
    this.state.actingSeat = next;
  }

  private maybeSkipToResolution(): void {
    // Handles the (rare) case where blinds alone put every contestant all-in preflop.
    const contestants = this.contestants();
    if (contestants.length <= 1) {
      this.resolveByFold(contestants[0] ?? null);
      return;
    }
    if (this.isRoundClosed()) {
      const canActCount = contestants.filter((p) => !p.isAllIn).length;
      if (canActCount <= 1) {
        this.runOutRemainingStreets();
        this.resolveShowdown();
      }
    }
  }

  private dealStreet(street: Street): void {
    if (!this.deck) throw new DevelopmentError('Deck not initialised');
    if (street === 'flop') this.state.community.push(...this.deck.drawMany(3));
    else if (street === 'turn' || street === 'river') this.state.community.push(...this.deck.drawMany(1));
    this.state.street = street;
  }

  private resetRoundState(): void {
    for (const p of this.state.players) p.committedThisStreet = 0;
    this.state.currentBet = 0;
    this.state.lastRaiseAmount = this.state.config.bigBlind;
    this.state.lastRaiseWasFullRaise = true;
    this.state.actedThisRound = [];
    this.state.cappedFromReraising = [];
  }

  private advanceStreet(): void {
    const nextStreet: Street = this.state.street === 'preflop' ? 'flop' : this.state.street === 'flop' ? 'turn' : 'river';
    this.dealStreet(nextStreet);
    this.resetRoundState();
    const firstActor = this.nextToAct(this.state.buttonSeat);
    this.state.actingSeat = firstActor;
    if (firstActor === null) {
      // Nobody left who can act (shouldn't happen given caller already checked canActCount>1), guard anyway.
      this.runOutRemainingStreets();
      this.resolveShowdown();
    }
  }

  private runOutRemainingStreets(): void {
    while (this.state.community.length < 5) {
      const nextStreet: Street = this.state.community.length === 0 ? 'flop' : this.state.community.length === 3 ? 'turn' : 'river';
      this.dealStreet(nextStreet);
    }
    for (const p of this.state.players) p.committedThisStreet = 0;
    this.state.actingSeat = null;
  }

  private finalizeBustedPlayers(): void {
    for (const p of this.state.players) {
      if (p.stack === 0) p.isActive = false;
    }
  }

  private resolveByFold(winner: Player | null): void {
    if (!winner) throw new DevelopmentError('Hand ended by fold but no winner remains');
    const { pots, refund } = calculateSidePots(
      this.state.players.map((p) => ({ playerId: p.id, committedTotal: p.committedTotal, hasFolded: p.hasFolded }))
    );
    if (refund) {
      const rp = this.state.players.find((p) => p.id === refund.playerId)!;
      rp.stack += refund.amount;
    }
    const totalWon = pots.reduce((sum, pot) => sum + pot.amount, 0);
    winner.stack += totalWon;
    this.state.showdownResults = this.state.players.map((p) => ({
      playerId: p.id,
      handValue: null,
      amountWon: p.id === winner.id ? totalWon : 0,
    }));
    this.state.pots = pots;
    this.state.isHandComplete = true;
    this.state.actingSeat = null;
    this.finalizeBustedPlayers();
  }

  private resolveShowdown(): void {
    const { pots, refund } = calculateSidePots(
      this.state.players.map((p) => ({ playerId: p.id, committedTotal: p.committedTotal, hasFolded: p.hasFolded }))
    );
    if (refund) {
      const rp = this.state.players.find((p) => p.id === refund.playerId)!;
      rp.stack += refund.amount;
    }

    const contestants = this.contestants();
    const handValues = new Map(contestants.map((p) => [p.id, evaluateBest([...p.holeCards, ...this.state.community])]));
    const winnings = new Map<string, number>(this.state.players.map((p) => [p.id, 0]));

    // Odd chips are awarded starting from the first eligible seat left of the button.
    const seatOrder = this.state.players
      .map((p) => p.seat)
      .filter((seat) => {
        const p = this.state.players.find((pp) => pp.seat === seat)!;
        return !p.hasFolded && p.isActive;
      });
    const orderedFromButton: number[] = [];
    for (let i = 1; i <= seatOrder.length; i++) {
      const seat = (this.state.buttonSeat + i) % this.state.players.length;
      if (seatOrder.includes(seat)) orderedFromButton.push(seat);
    }

    for (const pot of pots) {
      const eligible = pot.eligiblePlayerIds;
      let bestValue = null as ReturnType<typeof evaluateBest> | null;
      for (const id of eligible) {
        const v = handValues.get(id)!;
        if (!bestValue || compareHandValues(v, bestValue) > 0) bestValue = v;
      }
      const winners = eligible.filter((id) => compareHandValues(handValues.get(id)!, bestValue!) === 0);
      const winnersInSeatOrder = orderedFromButton
        .map((seat) => this.state.players.find((p) => p.seat === seat)!.id)
        .filter((id) => winners.includes(id));
      const split = splitPotAmount(pot.amount, winnersInSeatOrder.length > 0 ? winnersInSeatOrder : winners);
      for (const [id, amount] of split) {
        winnings.set(id, (winnings.get(id) ?? 0) + amount);
      }
    }

    for (const p of this.state.players) {
      const won = winnings.get(p.id) ?? 0;
      p.stack += won;
    }

    this.state.showdownResults = this.state.players.map((p) => ({
      playerId: p.id,
      handValue: handValues.get(p.id) ?? null,
      amountWon: winnings.get(p.id) ?? 0,
    }));
    this.state.pots = pots;
    this.state.street = 'showdown';
    this.state.isHandComplete = true;
    this.state.actingSeat = null;
    this.finalizeBustedPlayers();
  }
}

export function getTotalPot(state: TableState): number {
  return totalPot(state);
}

export function showdownWinners(results: ShowdownResult[] | null): ShowdownResult[] {
  if (!results) return [];
  return results.filter((r) => r.amountWon > 0);
}
