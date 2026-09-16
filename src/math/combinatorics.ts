export function factorial(n: number): number {
  if (n < 0) throw new Error('factorial requires a non-negative integer');
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/** Number of ways to choose k items from n, order not mattering (n choose k). */
export function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

/** How many distinct 2-card combinations exist for a specific starting-hand shape given how many of each rank remain unseen. */
export function holeCardCombinations(rank1Remaining: number, rank2Remaining: number, sameRank: boolean): number {
  if (sameRank) return combinations(rank1Remaining, 2);
  return rank1Remaining * rank2Remaining;
}
