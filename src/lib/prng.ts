/** Shared deterministic PRNG utilities for procedural game systems. */

export function hashSeed(...values: (string | number)[]): number {
  let hash = 2166136261;
  for (const value of values) {
    const str = String(value);
    for (let i = 0; i < str.length; i += 1) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  }
  return hash >>> 0;
}

/** Numeric-coordinate variant used by world-cell POI placement. */
export function hashSeedNumeric(...values: number[]): number {
  let hash = 2166136261;
  for (const value of values) {
    const int = Math.floor(value * 1000);
    hash ^= int;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
