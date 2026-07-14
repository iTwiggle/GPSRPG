import { afterEach, describe, expect, it, vi } from "vitest";
import { watchPlayerPosition } from "./geolocation";

describe("watchPlayerPosition", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps permission denial to denied status", () => {
    const updates: Array<{ status: string }> = [];
    const geolocation = {
      watchPosition: (
        _success: PositionCallback,
        error: PositionErrorCallback
      ) => {
        error({
          code: 1,
          message: "denied",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
        return 1;
      },
      clearWatch: vi.fn(),
    };

    vi.stubGlobal("navigator", { geolocation });

    watchPlayerPosition((snapshot) => {
      updates.push(snapshot);
    });

    expect(updates.at(-1)?.status).toBe("denied");
  });

  it("maps timeout errors to timeout status", () => {
    const updates: Array<{ status: string }> = [];
    const geolocation = {
      watchPosition: (
        _success: PositionCallback,
        error: PositionErrorCallback
      ) => {
        error({
          code: 3,
          message: "timeout",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
        return 1;
      },
      clearWatch: vi.fn(),
    };

    vi.stubGlobal("navigator", { geolocation });

    watchPlayerPosition((snapshot) => {
      updates.push(snapshot);
    });

    expect(updates.at(-1)?.status).toBe("timeout");
  });

  it("maps other geolocation failures to unavailable status", () => {
    const updates: Array<{ status: string }> = [];
    const geolocation = {
      watchPosition: (
        _success: PositionCallback,
        error: PositionErrorCallback
      ) => {
        error({
          code: 2,
          message: "unavailable",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
        return 1;
      },
      clearWatch: vi.fn(),
    };

    vi.stubGlobal("navigator", { geolocation });

    watchPlayerPosition((snapshot) => {
      updates.push(snapshot);
    });

    expect(updates.at(-1)?.status).toBe("unavailable");
  });
});
