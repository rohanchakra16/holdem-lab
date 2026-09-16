import { create } from 'zustand';
import { HandEngine, PlayerSetup, getTotalPot } from '../engine/engine';
import { BotPersonality, PlayerAction, TableState } from '../engine/types';
import { buildObservation, decideBotAction } from '../bots/botDecision';
import { mulberry32, randomSeed } from '../engine/rng';
import { buildCoachFeedback, CoachFeedback } from '../training/coach';
import { saveHand } from '../handHistory/handHistoryStore';
import { HandHistoryEntry } from '../handHistory/types';
import { useProgressStore } from './progressStore';

export type CoachingLevel = 'full' | 'important' | 'none';
export type GameMode = 'guided' | 'free';

export interface TableSettings {
  numPlayers: number; // 2-6
  startingStack: number;
  smallBlind: number;
  bigBlind: number;
  botPersonalities: BotPersonality[];
  mode: GameMode;
  coachingLevel: CoachingLevel;
  gameSpeedMs: number; // delay between bot actions
}

export const DEFAULT_SETTINGS: TableSettings = {
  numPlayers: 6,
  startingStack: 100, // in big blinds; converted to chips using bigBlind
  smallBlind: 1,
  bigBlind: 2,
  botPersonalities: ['tight-passive', 'loose-passive', 'tight-aggressive', 'loose-aggressive', 'balanced-advanced'],
  mode: 'guided',
  coachingLevel: 'full',
  gameSpeedMs: 900,
};

interface TableStoreState {
  engine: HandEngine | null;
  version: number;
  settings: TableSettings;
  isPaused: boolean;
  awaitingHumanAction: boolean;
  pendingFeedback: CoachFeedback | null;
  handOverAwaitingContinue: boolean;
  botTimer: ReturnType<typeof setTimeout> | null;

  startSession: (settings: TableSettings) => void;
  updateSettings: (partial: Partial<TableSettings>) => void;
  humanAct: (action: PlayerAction, reasoning?: string) => void;
  dealNextHand: () => void;
  togglePause: () => void;
  dismissFeedback: () => void;
  endSession: () => void;
  getState: () => TableState | null;
}

const HERO_ID = 'human';

function makePlayerSetups(settings: TableSettings): PlayerSetup[] {
  const setups: PlayerSetup[] = [{ id: HERO_ID, name: 'You', isHuman: true }];
  for (let i = 0; i < settings.numPlayers - 1; i++) {
    setups.push({
      id: `bot-${i}`,
      name: `Bot ${i + 1}`,
      isHuman: false,
      personality: settings.botPersonalities[i % settings.botPersonalities.length],
    });
  }
  return setups;
}

function recordHandHistory(engine: HandEngine, settings: TableSettings) {
  const state = engine.getState();
  if (!state.isHandComplete) return;
  const heroResult = state.showdownResults?.find((r) => r.playerId === HERO_ID);
  const heroPlayer = state.players.find((p) => p.id === HERO_ID)!;
  const heroNet = (heroResult?.amountWon ?? 0) - heroPlayer.committedTotal;
  const entry: HandHistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    handNumber: state.handNumber,
    timestamp: Date.now(),
    config: state.config,
    buttonSeat: state.buttonSeat,
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      isHuman: p.isHuman,
      seat: p.seat,
      startingStack: p.stack - (state.showdownResults?.find((r) => r.playerId === p.id)?.amountWon ?? 0) + p.committedTotal,
      endingStack: p.stack,
      holeCards: p.isHuman || state.showdownResults?.find((r) => r.playerId === p.id)?.handValue ? p.holeCards : [],
    })),
    community: state.community,
    actionHistory: state.actionHistory,
    showdownResults: state.showdownResults,
    heroId: HERO_ID,
    heroNetResult: heroNet,
    notes: '',
    mode: settings.mode,
  };
  saveHand(entry);
}

export const useTableStore = create<TableStoreState>((set, get) => ({
  engine: null,
  version: 0,
  settings: DEFAULT_SETTINGS,
  isPaused: false,
  awaitingHumanAction: false,
  pendingFeedback: null,
  handOverAwaitingContinue: false,
  botTimer: null,

  getState: () => get().engine?.getState() ?? null,

  startSession: (settings) => {
    const existing = get().botTimer;
    if (existing) clearTimeout(existing);
    const config = { smallBlind: settings.smallBlind, bigBlind: settings.bigBlind, startingStack: settings.startingStack * settings.bigBlind };
    const engine = new HandEngine(config, makePlayerSetups(settings), randomSeed());
    engine.startHand();
    set({ engine, settings, version: get().version + 1, isPaused: false, pendingFeedback: null, handOverAwaitingContinue: false });
    scheduleNext(get, set);
  },

  updateSettings: (partial) => set({ settings: { ...get().settings, ...partial } }),

  humanAct: (action, _reasoning) => {
    const { engine } = get();
    if (!engine) return;
    const state = engine.getState();
    const player = state.players.find((p) => p.id === HERO_ID)!;
    const { settings } = get();

    let feedback: CoachFeedback | null = null;
    if (settings.coachingLevel !== 'none') {
      feedback = buildCoachFeedback(state, player, action, randomSeed());
      if (settings.coachingLevel === 'important' && feedback && !feedback.isImportantDecision && feedback.isLegal) {
        feedback = null;
      }
    }

    try {
      engine.applyAction(HERO_ID, action);
    } catch (err) {
      set({
        pendingFeedback: {
          isLegal: false,
          assessment: err instanceof Error ? err.message : 'Illegal action',
          potBefore: 0,
          callAmount: 0,
          requiredEquity: null,
          estimatedEquity: null,
          evOfCalling: null,
          positionNote: '',
          effectiveStack: 0,
          stackToPotRatio: 0,
          lesson: '',
          isImportantDecision: false,
          outcomeNote: '',
        },
      });
      return;
    }

    const afterState = engine.getState();
    if (afterState.isHandComplete) {
      recordHandHistory(engine, settings);
      const heroFinal = afterState.players.find((p) => p.id === HERO_ID)!;
      const heroDelta = afterState.showdownResults?.find((r) => r.playerId === HERO_ID)?.amountWon ?? 0;
      useProgressStore.getState().recordChipResult(heroDelta, heroFinal.stack);
    }

    set({ version: get().version + 1, pendingFeedback: feedback, awaitingHumanAction: false, handOverAwaitingContinue: afterState.isHandComplete });
    scheduleNext(get, set);
  },

  dealNextHand: () => {
    const { engine } = get();
    if (!engine) return;
    const active = engine.getState().players.filter((p) => p.isActive).length;
    if (active < 2) return;
    engine.startHand();
    set({ version: get().version + 1, pendingFeedback: null, handOverAwaitingContinue: false });
    scheduleNext(get, set);
  },

  togglePause: () => {
    const paused = !get().isPaused;
    set({ isPaused: paused });
    if (!paused) scheduleNext(get, set);
    else {
      const t = get().botTimer;
      if (t) clearTimeout(t);
      set({ botTimer: null });
    }
  },

  dismissFeedback: () => set({ pendingFeedback: null }),

  endSession: () => {
    const t = get().botTimer;
    if (t) clearTimeout(t);
    set({ engine: null, botTimer: null, pendingFeedback: null, handOverAwaitingContinue: false });
  },
}));

function scheduleNext(get: () => TableStoreState, set: (partial: Partial<TableStoreState>) => void) {
  const { engine, settings, isPaused } = get();
  if (!engine || isPaused) return;
  const state = engine.getState();

  if (state.isHandComplete) {
    set({ handOverAwaitingContinue: true });
    if (settings.mode === 'free') {
      const active = state.players.filter((p) => p.isActive).length;
      if (active < 2) return;
      const timer = setTimeout(() => {
        const s = get();
        if (!s.engine || s.isPaused) return;
        s.engine.startHand();
        set({ version: get().version + 1, pendingFeedback: null, handOverAwaitingContinue: false });
        scheduleNext(get, set);
      }, Math.max(600, settings.gameSpeedMs));
      set({ botTimer: timer });
    }
    return; // guided mode waits for explicit dealNextHand()
  }

  const actingSeat = state.actingSeat;
  if (actingSeat === null) return;
  const actor = state.players.find((p) => p.seat === actingSeat)!;
  if (actor.isHuman) {
    set({ awaitingHumanAction: true });
    return;
  }

  const timer = setTimeout(() => {
    const s = get();
    if (!s.engine || s.isPaused) return;
    const st = s.engine.getState();
    if (st.isHandComplete || st.actingSeat === null) return;
    const bot = st.players.find((p) => p.seat === st.actingSeat)!;
    if (bot.isHuman) return;
    const rng = mulberry32(randomSeed());
    const obs = buildObservation(st, bot, getTotalPot(st), rng);
    const action = decideBotAction(obs);
    s.engine.applyAction(bot.id, action);
    const after = s.engine.getState();
    if (after.isHandComplete) recordHandHistory(s.engine, s.settings);
    set({ version: get().version + 1 });
    scheduleNext(get, set);
  }, settings.gameSpeedMs);
  set({ botTimer: timer });
}
