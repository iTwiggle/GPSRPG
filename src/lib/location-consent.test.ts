import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  inferLegacyLiveConsent,
  readLocationConsent,
  writeLocationConsent,
} from "./location-consent";

const CONSENT_KEY = "gpsrpg-location-consent-v1";
const GAME_STATE_KEY = "gpsrpg-game-state-v1";

describe("location consent", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
  });

  it("reads and writes explicit consent choices", () => {
    expect(readLocationConsent()).toBeNull();

    writeLocationConsent("demo");
    expect(readLocationConsent()).toBe("demo");

    writeLocationConsent("live");
    expect(readLocationConsent()).toBe("live");
    expect(localStorage.getItem(CONSENT_KEY)).toBe("live");
  });

  it("infers live consent when a legacy save exists", () => {
    localStorage.setItem(GAME_STATE_KEY, "{}");

    expect(inferLegacyLiveConsent()).toBe(true);
    expect(readLocationConsent()).toBeNull();
  });
});
