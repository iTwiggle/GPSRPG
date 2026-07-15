import { describe, expect, it } from "vitest";
import { offsetPosition } from "@/lib/distance";
import {
  createEmptyMovementLedger,
  metersToLeagues,
  sampleMovementLedger,
  stripTransientMovementSample,
} from "./movement-ledger";

const DATE = "2026-07-14";
const T0 = `${DATE}T12:00:00.000Z`;
const ORIGIN = { lat: 37.7749, lng: -122.4194 };
const LIVE = { accuracyMeters: 5, source: "live" as const };

describe("movement ledger", () => {
  it("starts empty and reports zero leagues", () => {
    const ledger = createEmptyMovementLedger(DATE);
    expect(ledger.totalMeters).toBe(0);
    expect(metersToLeagues(ledger.todayMeters)).toBe(0);
  });

  it("accumulates plausible walking after crossing the GPS noise floor", () => {
    const seeded = sampleMovementLedger(
      createEmptyMovementLedger(DATE),
      ORIGIN,
      T0,
      LIVE
    );
    const jitter = sampleMovementLedger(
      seeded,
      offsetPosition(ORIGIN, 5, 0),
      `${DATE}T12:00:05.000Z`,
      LIVE
    );
    const walked = sampleMovementLedger(
      jitter,
      offsetPosition(ORIGIN, 25, 0),
      `${DATE}T12:00:15.000Z`,
      LIVE
    );
    expect(jitter.totalMeters).toBe(0);
    expect(walked.totalMeters).toBeGreaterThan(20);
  });

  it("rejects Demo movement, poor fixes, teleports, and vehicle speed", () => {
    const start = createEmptyMovementLedger(DATE);
    expect(
      sampleMovementLedger(start, ORIGIN, T0, {
        accuracyMeters: 5,
        source: "demo",
      }).lastPosition
    ).toBeUndefined();
    expect(
      sampleMovementLedger(start, ORIGIN, T0, {
        accuracyMeters: 80,
        source: "live",
      }).lastPosition
    ).toBeUndefined();
    const seeded = sampleMovementLedger(start, ORIGIN, T0, LIVE);
    expect(
      sampleMovementLedger(
        seeded,
        offsetPosition(ORIGIN, 80, 0),
        `${DATE}T12:00:05.000Z`,
        LIVE
      ).totalMeters
    ).toBe(0);
    expect(
      sampleMovementLedger(
        seeded,
        offsetPosition(ORIGIN, 200, 0),
        `${DATE}T12:00:30.000Z`,
        LIVE
      ).totalMeters
    ).toBe(0);
  });

  it("re-anchors after a background gap without crediting it", () => {
    const seeded = sampleMovementLedger(
      createEmptyMovementLedger(DATE),
      ORIGIN,
      T0,
      LIVE
    );
    const resumed = sampleMovementLedger(
      seeded,
      offsetPosition(ORIGIN, 80, 0),
      `${DATE}T12:05:00.000Z`,
      LIVE
    );
    expect(resumed.totalMeters).toBe(0);
    expect(resumed.lastPosition).toEqual(offsetPosition(ORIGIN, 80, 0));
  });

  it("starts a new-day anchor without crediting movement between days", () => {
    const seeded = sampleMovementLedger(
      createEmptyMovementLedger(DATE),
      ORIGIN,
      T0,
      LIVE
    );
    const nextDay = sampleMovementLedger(
      seeded,
      offsetPosition(ORIGIN, 25, 0),
      "2026-07-15T12:00:10.000Z",
      LIVE
    );
    expect(nextDay.todayDate).toBe("2026-07-15");
    expect(nextDay.todayMeters).toBe(0);
  });

  it("removes the precise runtime sample before persistence", () => {
    const persisted = stripTransientMovementSample({
      ...createEmptyMovementLedger(DATE),
      totalMeters: 320,
      todayMeters: 320,
      lastPosition: ORIGIN,
      lastSampleAt: T0,
      lastAccuracyMeters: 5,
    });

    expect(persisted.totalMeters).toBe(320);
    expect(persisted.lastPosition).toBeUndefined();
    expect(persisted.lastSampleAt).toBeUndefined();
    expect(persisted.lastAccuracyMeters).toBeUndefined();
  });
});
