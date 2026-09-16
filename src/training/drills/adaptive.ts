import { ALL_CATEGORIES, DrillCategory } from './generators';
import { DrillCategoryStats } from '../../state/progressStore';

/**
 * Weighted category selection for "focus on weak areas" practice. Categories
 * with lower measured accuracy get picked more often; categories you have
 * not tried yet are treated as moderately (not maximally) weak so they get
 * surfaced without completely dominating a session. A small floor weight is
 * kept even for mastered categories so retention practice (interleaving)
 * still happens occasionally, per standard spaced-repetition practice.
 */
export function pickAdaptiveCategory(drillStats: Record<string, DrillCategoryStats>, rand: () => number = Math.random): DrillCategory {
  const weights = ALL_CATEGORIES.map((c) => {
    const stat = drillStats[c.id];
    const accuracy = stat && stat.attempts > 0 ? stat.correct / stat.attempts : 0.4; // unpracticed = mildly weak, not "worst"
    const weakness = 1 - accuracy;
    return { id: c.id, weight: Math.max(0.15, weakness) };
  });

  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  let roll = rand() * total;
  for (const w of weights) {
    roll -= w.weight;
    if (roll <= 0) return w.id;
  }
  return weights[weights.length - 1].id;
}

/** Category accuracy sorted weakest-first, for display ("what you're focusing on and why"). */
export function weakestCategories(drillStats: Record<string, DrillCategoryStats>, count = 3): { id: DrillCategory; label: string; accuracy: number | null }[] {
  return ALL_CATEGORIES.map((c) => {
    const stat = drillStats[c.id];
    return { id: c.id, label: c.label, accuracy: stat && stat.attempts > 0 ? stat.correct / stat.attempts : null };
  })
    .sort((a, b) => (a.accuracy ?? 0.4) - (b.accuracy ?? 0.4))
    .slice(0, count);
}
