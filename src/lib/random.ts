/** FNV-1a style seed hash for deterministic rolls. */
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

/** Mulberry32-style PRNG from a 32-bit seed. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
