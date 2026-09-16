/**
 * Deterministic seeded PRNG (mulberry32) for reproducible tests and hand
 * replays. Normal play seeds from crypto-random entropy so real games are
 * unpredictable; tests pass an explicit numeric seed for reproducibility.
 */
export type RNG = () => number;

export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Produces a random 32-bit seed using crypto entropy where available. */
export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0];
  }
  return Math.floor(Math.random() * 0xffffffff);
}

export function createRng(seed?: number): { rng: RNG; seed: number } {
  const s = seed ?? randomSeed();
  return { rng: mulberry32(s), seed: s };
}

/** Fisher-Yates shuffle, in place, using the supplied RNG. Returns the array for convenience. */
export function shuffleInPlace<T>(arr: T[], rng: RNG): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
