import { describe, expect, it } from "vitest";
import { createEmptyMovementLedger } from "./movement-ledger";
import { getLocalDateString } from "@/lib/tasks";
import {
  applyTrailSurgeXp,
  getTrailMomentumStatus,
  TRAIL_MOMENTUM_TARGET_METERS,
} from "./trail-momentum";

describe("Trail Momentum", () => {
  it("unlocks Scout's Eye at 1.2 km", () => {
    const status = getTrailMomentumStatus({ ...createEmptyMovementLedger("2026-07-15"), todayMeters: TRAIL_MOMENTUM_TARGET_METERS }, "2026-07-15");
    expect(status.scoutsEyeActive).toBe(true);
    expect(status.liveRevealRadiusMeters).toBe(200);
  });
  it("does not carry the boon into a new local day", () => {
    const status = getTrailMomentumStatus({ ...createEmptyMovementLedger("2026-07-14"), todayMeters: 2000 }, "2026-07-15");
    expect(status.scoutsEyeActive).toBe(false);
    expect(status.distanceMeters).toBe(0);
  });
  it("adds ten percent encounter XP while Trail Surge is active", () => {
    const ledger = {
      ...createEmptyMovementLedger(getLocalDateString()),
      trailSurgeUnlockedToday: true,
    };
    const result = applyTrailSurgeXp(
      { xpGained: 25, loot: [], flavorText: "A brisk test." },
      ledger
    );
    expect(result.bonusXp).toBe(3);
    expect(result.encounter.xpGained).toBe(28);
  });
  it("can preview Trail Surge without mutating movement progress", () => {
    const ledger = createEmptyMovementLedger("2026-07-15");
    const result = applyTrailSurgeXp(
      { xpGained: 10, loot: [], flavorText: "Preview." },
      ledger,
      true
    );
    expect(result.encounter.xpGained).toBe(11);
    expect(ledger.trailSurgeWindowMeters).toBe(0);
    expect(ledger.trailSurgeUnlockedToday).toBe(false);
  });
});
