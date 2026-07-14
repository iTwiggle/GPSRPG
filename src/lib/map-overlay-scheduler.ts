/** Coalesce overlay repaints — map pan/zoom uses immediate; player GPS uses debounced. */
export function createOverlayRedrawScheduler(
  draw: () => void,
  debounceMs = 120
) {
  let rafId: number | null = null;
  let debounceId: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (debounceId !== null) {
      clearTimeout(debounceId);
      debounceId = null;
    }
  };

  const paintNow = () => {
    cancel();
    rafId = requestAnimationFrame(() => {
      rafId = null;
      draw();
    });
  };

  const paintDebounced = () => {
    if (debounceId !== null) clearTimeout(debounceId);
    debounceId = setTimeout(() => {
      debounceId = null;
      paintNow();
    }, debounceMs);
  };

  return { paintNow, paintDebounced, cancel };
}
