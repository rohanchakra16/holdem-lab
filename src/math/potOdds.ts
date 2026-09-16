/**
 * Pot odds: the break-even equity you need to profitably call a bet,
 * expressed as callAmount / (potBeforeCall + callAmount).
 * This is EXACT arithmetic, not an approximation.
 */
export function requiredEquityToCall(potBeforeCall: number, callAmount: number): number {
  if (callAmount <= 0) return 0;
  return callAmount / (potBeforeCall + callAmount);
}

/** Expresses pot odds as a simplified "X : 1" ratio (pot : call). */
export function potOddsRatio(potBeforeCall: number, callAmount: number): { potToOne: number } {
  if (callAmount <= 0) return { potToOne: Infinity };
  return { potToOne: potBeforeCall / callAmount };
}

/** The size of pot needed, given a call amount, so that a target equity breaks even. */
export function potSizeForBreakEven(callAmount: number, targetEquity: number): number {
  if (targetEquity <= 0 || targetEquity >= 1) throw new Error('targetEquity must be strictly between 0 and 1');
  return callAmount * (1 - targetEquity) / targetEquity;
}

export type BetSizePreset = 'third' | 'half' | 'twoThirds' | 'pot' | 'allIn';

export function betSizeFromPreset(preset: BetSizePreset, pot: number, effectiveStack: number): number {
  const fractions: Record<Exclude<BetSizePreset, 'allIn'>, number> = {
    third: 1 / 3,
    half: 1 / 2,
    twoThirds: 2 / 3,
    pot: 1,
  };
  if (preset === 'allIn') return effectiveStack;
  return Math.min(Math.round(pot * fractions[preset]), effectiveStack);
}

/** Stack-to-pot ratio: effective remaining stack divided by the current pot. */
export function stackToPotRatio(effectiveStack: number, pot: number): number {
  if (pot <= 0) return Infinity;
  return effectiveStack / pot;
}
