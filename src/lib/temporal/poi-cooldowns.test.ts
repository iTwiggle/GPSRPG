import { describe, expect, it } from "vitest";
import {
  canReExplorePoi,
  formatCooldownRemaining,
  getPoiVisitUiStatus,
} from "./poi-cooldowns";
import type { VisitedPoiState } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.parse("2026-07-14T12:00:00.000Z");

function visitAt(iso: string): VisitedPoiState {
  return {
    lastExploredAt: iso,
    exploreCount: 1,
    poiType: "cache",
  };
}

describe("poi cooldowns", () => {
  it("treats landmarks as one-time visits", () => {
    const visit = visitAt("2026-07-01T00:00:00.000Z");
    expect(canReExplorePoi(visit, "tower", now)).toBe(false);
    expect(getPoiVisitUiStatus(visit, "tower", now)).toBe("landmark_done");
  });

  it("blocks daily POIs until cooldown elapses", () => {
    const visit = visitAt("2026-07-14T10:00:00.000Z");
    expect(canReExplorePoi(visit, "cache", now)).toBe(false);
    expect(getPoiVisitUiStatus(visit, "cache", now)).toBe("cooldown");
    expect(
      canReExplorePoi(visit, "cache", now + DAY_MS)
    ).toBe(true);
    expect(getPoiVisitUiStatus(visit, "cache", now + DAY_MS)).toBe("ready");
  });

  it("formats remaining cooldown time", () => {
    expect(formatCooldownRemaining(0)).toBe("Ready");
    expect(formatCooldownRemaining(3 * 60 * 60 * 1000)).toBe("3h");
    expect(formatCooldownRemaining(2 * DAY_MS)).toBe("2d");
  });
});
