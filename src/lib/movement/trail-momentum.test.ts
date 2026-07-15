import { describe, expect, it } from "vitest";
import { createEmptyMovementLedger } from "./movement-ledger";
import { getTrailMomentumStatus, TRAIL_MOMENTUM_TARGET_METERS } from "./trail-momentum";

describe("Trail Momentum", () => {
  it("unlocks Scout's Eye at 1.2 km", () => {
    const status = getTrailMomentumStatus({ ...createEmptyMovementLedger("2026-07-15"), todayMeters: TRAIL_MOMENTUM_TARGET_METERS }, "2026-07-15");
    expect(status.scoutsEyeActive).toBe(true);
    expect(status.liveRevealRadiusMeters).toBe(144);
  });
  it("does not carry the boon into a new local day", () => {
    const status = getTrailMomentumStatus({ ...createEmptyMovementLedger("2026-07-14"), todayMeters: 2000 }, "2026-07-15");
    expect(status.scoutsEyeActive).toBe(false);
    expect(status.distanceMeters).toBe(0);
  });
});
