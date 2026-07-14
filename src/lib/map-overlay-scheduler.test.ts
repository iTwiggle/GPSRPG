import { describe, expect, it, vi } from "vitest";
import { createOverlayRedrawScheduler } from "./map-overlay-scheduler";

describe("createOverlayRedrawScheduler", () => {
  it("debounces rapid paintDebounced calls", () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    const draw = vi.fn();
    const scheduler = createOverlayRedrawScheduler(draw, 100);

    scheduler.paintDebounced();
    scheduler.paintDebounced();
    scheduler.paintDebounced();

    expect(draw).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(draw).toHaveBeenCalledTimes(1);

    scheduler.cancel();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("paints immediately with paintNow", () => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    const draw = vi.fn();
    const scheduler = createOverlayRedrawScheduler(draw);

    scheduler.paintNow();
    expect(draw).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
