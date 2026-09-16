/**
 * Expected value of calling a bet, given the probability of winning the
 * showdown (ties handled via `tieProbability` splitting the pot with
 * `tiedWithCount` other players). Folding always has EV 0 relative to the
 * current decision point (any chips already in the pot are sunk).
 */
export function evOfCall(params: {
  potBeforeCall: number;
  callAmount: number;
  winProbability: number;
  tieProbability?: number;
  tiedWithCount?: number; // total players sharing the tie, including hero
}): number {
  const { potBeforeCall, callAmount, winProbability } = params;
  const tieProbability = params.tieProbability ?? 0;
  const tiedWithCount = params.tiedWithCount ?? 2;
  const finalPot = potBeforeCall + callAmount;
  const winEv = winProbability * finalPot;
  const tieEv = tieProbability * (finalPot / tiedWithCount);
  // Losing contributes 0 to EV (a losing call wins nothing back) — omitted from the sum below.
  return winEv + tieEv - callAmount;
}

export const EV_OF_FOLD = 0;

/**
 * Expected value of a bet/raise that can be either called or folded to
 * (simplified two-outcome model: opponent folds, or opponent calls and it
 * goes to showdown with the given win probability). This is a heuristic
 * planning tool, not exact solved-game EV — it does not model further
 * raises or bluff-raises back.
 */
export function evOfBet(params: {
  potBeforeBet: number;
  betAmount: number;
  foldProbability: number;
  winProbabilityIfCalled: number;
  tieProbabilityIfCalled?: number;
}): number {
  const { potBeforeBet, betAmount, foldProbability, winProbabilityIfCalled } = params;
  const tieProbabilityIfCalled = params.tieProbabilityIfCalled ?? 0;
  const callProbability = 1 - foldProbability;
  const evIfFolds = foldProbability * potBeforeBet;
  const finalPotIfCalled = potBeforeBet + betAmount * 2;
  const loseProbabilityIfCalled = 1 - winProbabilityIfCalled - tieProbabilityIfCalled;
  const evIfCalled =
    callProbability *
    (winProbabilityIfCalled * finalPotIfCalled + tieProbabilityIfCalled * (finalPotIfCalled / 2) + loseProbabilityIfCalled * -betAmount);
  return evIfFolds + evIfCalled;
}

/** The minimum fold frequency at which a bluff bet breaks even, assuming 0% equity when called (a "pure" bluff). */
export function breakEvenBluffFoldFrequency(potBeforeBet: number, betAmount: number): number {
  return betAmount / (potBeforeBet + betAmount);
}
