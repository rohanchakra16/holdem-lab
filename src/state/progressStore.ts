import { create } from 'zustand';
import { loadJSON, saveJSON } from '../storage/localStorage';

export interface DrillCategoryStats {
  attempts: number;
  correct: number;
  totalResponseMs: number;
}

export interface ProgressData {
  completedLessons: string[];
  drillStats: Record<string, DrillCategoryStats>;
  rapidDecisionStats: Record<string, DrillCategoryStats>;
  chipHistory: { timestamp: number; delta: number; stackAfter: number }[];
  experienceLevel: 'beginner' | 'some-experience' | 'experienced' | null;
  onboardingComplete: boolean;
  mistakeLog: { timestamp: number; category: string; description: string }[];
}

const KEY = 'progress';

function defaultProgress(): ProgressData {
  return {
    completedLessons: [],
    drillStats: {},
    rapidDecisionStats: {},
    chipHistory: [],
    experienceLevel: null,
    onboardingComplete: false,
    mistakeLog: [],
  };
}

interface ProgressState extends ProgressData {
  completeLesson: (id: string) => void;
  recordDrillResult: (category: string, correct: boolean, responseMs: number, kind?: 'drill' | 'rapid-decision') => void;
  recordChipResult: (delta: number, stackAfter: number) => void;
  setExperienceLevel: (level: ProgressData['experienceLevel']) => void;
  completeOnboarding: () => void;
  logMistake: (category: string, description: string) => void;
  resetProgress: () => void;
}

function persist(data: ProgressData) {
  saveJSON(KEY, data);
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  ...loadJSON<ProgressData>(KEY, defaultProgress()),

  completeLesson: (id) => {
    const completed = new Set(get().completedLessons);
    completed.add(id);
    const next = { ...get(), completedLessons: [...completed] };
    persist(next);
    set(next);
  },

  recordDrillResult: (category, correct, responseMs, kind = 'drill') => {
    const key = kind === 'rapid-decision' ? 'rapidDecisionStats' : 'drillStats';
    const stats = { ...get()[key] };
    const prev = stats[category] ?? { attempts: 0, correct: 0, totalResponseMs: 0 };
    stats[category] = {
      attempts: prev.attempts + 1,
      correct: prev.correct + (correct ? 1 : 0),
      totalResponseMs: prev.totalResponseMs + responseMs,
    };
    const next = { ...get(), [key]: stats };
    persist(next);
    set(next);
  },

  recordChipResult: (delta, stackAfter) => {
    const history = [...get().chipHistory, { timestamp: Date.now(), delta, stackAfter }].slice(-1000);
    const next = { ...get(), chipHistory: history };
    persist(next);
    set(next);
  },

  setExperienceLevel: (level) => {
    const next = { ...get(), experienceLevel: level };
    persist(next);
    set(next);
  },

  completeOnboarding: () => {
    const next = { ...get(), onboardingComplete: true };
    persist(next);
    set(next);
  },

  logMistake: (category, description) => {
    const log = [...get().mistakeLog, { timestamp: Date.now(), category, description }].slice(-200);
    const next = { ...get(), mistakeLog: log };
    persist(next);
    set(next);
  },

  resetProgress: () => {
    const next = defaultProgress();
    persist(next);
    set(next);
  },
}));
