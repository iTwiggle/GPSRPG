import { describe, expect, it } from "vitest";
import {
  createEmptyMovementLedger,
  metersToLeagues,
  sampleMovementLedger,
  stripTransientMovementSample,
} from "./movement-ledger";

describe("movement ledger", () => {
  it("starts empty and reports zero leagues", () => {
    const ledger = createEmptyMovementLedger();
    expect(ledger.totalMeters).toBe(0);
    expect(metersToLeagues(ledger.todayMeters)).toBe(0);
  });

  it("accumulates distance when movement exceeds the speed threshold", () => {
    const start = createEmptyMovementLedger();
    const t0 = "2026-07-14T12:00:00.000Z";
    const t1 = "2026-07-14T12:00:10.000Z";

    const seeded = sampleMovementLedger(
      start,
      { lat: 37.7749, lng: -122.4194 },
      t0
    );
    const moved = sampleMovementLedger(
      seeded,
      { lat: 37.7759, lng: -122.4194 },
      t1
    );

    expect(moved.totalMeters).toBeGreaterThan(0);
    expect(moved.todayMeters).toBe(moved.totalMeters);
    expect(metersToLeagues(moved.totalMeters)).toBeGreaterThan(0);
  });

  it("ignores tiny jitter below the motion threshold", () => {
    const start = createEmptyMovementLedger();
    const t0 = "2026-07-14T12:00:00.000Z";
    const t1 = "2026-07-14T12:00:10.000Z";

    const seeded = sampleMovementLedger(
      start,
      { lat: 37.7749, lng: -122.4194 },
      t0
    );
    const jitter = sampleMovementLedger(
      seeded,
      { lat: 37.7749005, lng: -122.4194 },
      t1
    );

    expect(jitter.totalMeters).toBe(0);
  });

  it("removes the precise runtime sample before persistence", () => {
    const sampled = sampleMovementLedger(
      createEmptyMovementLedger(),
      { lat: 37.7749, lng: -122.4194 },
      "2026-07-14T12:00:00.000Z"
    );

    const persisted = stripTransientMovementSample(sampled);

    expect(persisted.lastPosition).toBeUndefined();
    expect(persisted.lastSampleAt).toBeUndefined();
    expect(persisted.lastOutdoorSessionAt).toBe(
      "2026-07-14T12:00:00.000Z"
    );
  });
});
