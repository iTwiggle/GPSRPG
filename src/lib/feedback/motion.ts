/**
 * Reduced-motion gate. Every animated effect must consult this so accessibility
 * is honored in one place rather than sprinkled through components.
 *
 * When reduced motion is requested we keep the *information* (a reward happened)
 * but drop travel, scaling, and particles in favor of a brief opacity change.
 */

let cachedQuery: MediaQueryList | null = null;

function getQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || !window.matchMedia) return null;
  if (!cachedQuery) {
    cachedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  }
  return cachedQuery;
}

export function prefersReducedMotion(): boolean {
  return getQuery()?.matches ?? false;
}

/** Subscribe to live changes (e.g. user toggles the OS setting). */
export function onReducedMotionChange(
  listener: (reduced: boolean) => void
): () => void {
  const query = getQuery();
  if (!query) return () => {};
  const handler = (event: MediaQueryListEvent) => listener(event.matches);
  query.addEventListener("change", handler);
  return () => query.removeEventListener("change", handler);
}
