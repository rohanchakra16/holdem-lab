import { SidePot } from './types';

export interface Contribution {
  playerId: string;
  committedTotal: number;
  hasFolded: boolean;
}

export interface PotCalculationResult {
  pots: SidePot[];
  /** Uncalled chips returned to a player because no one matched their final bet/raise. */
  refund: { playerId: string; amount: number } | null;
}

/**
 * Computes main and side pots from each player's total chips committed this
 * hand, correctly handling uncalled bets, short all-ins, and multiple
 * all-in levels. Only the single most recent aggressive action in a hand
 * can ever be uncalled (earlier uncalled bets would have already ended the
 * hand), so at most one refund is ever produced.
 */
export function calculateSidePots(contributions: Contribution[]): PotCalculationResult {
  const working = contributions.map((c) => ({ ...c }));
  let refund: PotCalculationResult['refund'] = null;

  const withChips = working.filter((c) => c.committedTotal > 0);
  if (withChips.length > 0) {
    const maxAmount = Math.max(...withChips.map((c) => c.committedTotal));
    const atMax = withChips.filter((c) => c.committedTotal === maxAmount);
    if (atMax.length === 1) {
      const secondHighest = Math.max(0, ...withChips.filter((c) => c.committedTotal !== maxAmount).map((c) => c.committedTotal));
      if (maxAmount > secondHighest) {
        const player = working.find((c) => c.playerId === atMax[0].playerId)!;
        refund = { playerId: player.playerId, amount: maxAmount - secondHighest };
        player.committedTotal = secondHighest;
      }
    }
  }

  const levels = [...new Set(working.filter((c) => c.committedTotal > 0).map((c) => c.committedTotal))].sort((a, b) => a - b);

  const pots: SidePot[] = [];
  let previousLevel = 0;
  for (const level of levels) {
    const increment = level - previousLevel;
    const contributors = working.filter((c) => c.committedTotal >= level);
    const amount = increment * contributors.length;
    const eligiblePlayerIds = contributors.filter((c) => !c.hasFolded).map((c) => c.playerId);
    if (amount > 0) {
      pots.push({ amount, eligiblePlayerIds });
    }
    previousLevel = level;
  }

  return { pots, refund };
}

/**
 * Splits a pot's amount among the given winner ids as evenly as possible in
 * whole chips, awarding any odd remainder chips one at a time starting from
 * the first winner in the supplied order (matching common cardroom
 * convention of awarding odd chips starting from the first eligible seat
 * left of the button).
 */
export function splitPotAmount(amount: number, winnerIdsInOrder: string[]): Map<string, number> {
  const result = new Map<string, number>();
  if (winnerIdsInOrder.length === 0) return result;
  const base = Math.floor(amount / winnerIdsInOrder.length);
  let remainder = amount - base * winnerIdsInOrder.length;
  for (const id of winnerIdsInOrder) {
    let share = base;
    if (remainder > 0) {
      share += 1;
      remainder -= 1;
    }
    result.set(id, share);
  }
  return result;
}
