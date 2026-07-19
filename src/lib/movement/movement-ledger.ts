import { distanceMeters } from "@/lib/distance";
import { getLocalDateString } from "@/lib/tasks";
import type { MovementLedger, Position } from "@/lib/types";

export const METERS_PER_LEAGUE = 1000;
export const MOTION_SPEED_THRESHOLD_MPS = 0.5;
export const MAX_WALKING_SPEED_MPS = 4.5;
export const MAX_SAMPLE_GAP_MS = 120_000;
export const MAX_SAMPLE_ACCURACY_METERS = 35;
export const MIN_MOVEMENT_SEGMENT_METERS = 12;
export const MAX_MOVEMENT_SEGMENT_METERS = 120;
export const TRAIL_SURGE_WINDOW_MS = 60 * 60 * 1000;
export const TRAIL_SURGE_TARGET_METERS = 800;

export interface MovementSampleOptions {
  accuracyMeters: number;
  source: "live" | "demo";
}

export function createEmptyMovementLedger(
  today: string = getLocalDateString()
): MovementLedger {
  return {
    totalMeters: 0,
    todayMeters: 0,
    todayDate: today,
    totalMinutesInMotion: 0,
    todayMinutesInMotion: 0,
    outingsCompleted: 0,
    lastOutdoorSessionAt: null,
    trailSurgeWindowStartedAt: null,
    trailSurgeWindowMeters: 0,
    trailSurgeUnlockedToday: false,
  };
}

export function normalizeMovementLedger(
  ledger: Partial<MovementLedger> | undefined,
  today: string = getLocalDateString()
): MovementLedger {
  const empty = createEmptyMovementLedger(today);
  if (!ledger) return empty;

  const todayDate = ledger.todayDate ?? today;
  const isToday = todayDate === today;

  return {
    totalMeters: ledger.totalMeters ?? 0,
    todayMeters: isToday ? (ledger.todayMeters ?? 0) : 0,
    todayDate: isToday ? todayDate : today,
    totalMinutesInMotion: ledger.totalMinutesInMotion ?? 0,
    todayMinutesInMotion: isToday ? (ledger.todayMinutesInMotion ?? 0) : 0,
    outingsCompleted: ledger.outingsCompleted ?? 0,
    lastOutdoorSessionAt: ledger.lastOutdoorSessionAt ?? null,
    trailSurgeWindowStartedAt: isToday
      ? (ledger.trailSurgeWindowStartedAt ?? null)
      : null,
    trailSurgeWindowMeters: isToday
      ? (ledger.trailSurgeWindowMeters ?? 0)
      : 0,
    trailSurgeUnlockedToday: isToday
      ? (ledger.trailSurgeUnlockedToday ?? false)
      : false,
    lastPosition: isToday ? ledger.lastPosition : undefined,
    lastSampleAt: isToday ? ledger.lastSampleAt : undefined,
    lastAccuracyMeters: isToday ? ledger.lastAccuracyMeters : undefined,
  };
}

/**
 * Exact GPS samples are runtime-only inputs for distance deltas.
 * Persist aggregate movement totals, never the latest precise coordinate.
 */
export function stripTransientMovementSample(
  ledger: MovementLedger
): MovementLedger {
  const {
    lastPosition: _lastPosition,
    lastSampleAt: _lastSampleAt,
    lastAccuracyMeters: _lastAccuracyMeters,
    ...rest
  } = ledger;
  return rest;
}

export function metersToLeagues(meters: number): number {
  return Math.round((meters / METERS_PER_LEAGUE) * 10) / 10;
}

export function sampleMovementLedger(
  ledger: MovementLedger,
  position: Position,
  sampledAt: string = new Date().toISOString(),
  options: MovementSampleOptions
): MovementLedger {
  const today = getLocalDateString(new Date(sampledAt));
  const next = normalizeMovementLedger(ledger, today);

  if (
    options.source !== "live" ||
    !Number.isFinite(options.accuracyMeters) ||
    options.accuracyMeters <= 0 ||
    options.accuracyMeters > MAX_SAMPLE_ACCURACY_METERS
  ) {
    return next;
  }

  if (!next.lastPosition || !next.lastSampleAt) {
    return {
      ...next,
      lastPosition: position,
      lastSampleAt: sampledAt,
      lastAccuracyMeters: options.accuracyMeters,
      lastOutdoorSessionAt: sampledAt,
    };
  }

  const gapMs = Math.max(
    0,
    Date.parse(sampledAt) - Date.parse(next.lastSampleAt)
  );
  if (gapMs <= 0 || gapMs > MAX_SAMPLE_GAP_MS) {
    return {
      ...next,
      lastPosition: position,
      lastSampleAt: sampledAt,
      lastAccuracyMeters: options.accuracyMeters,
      lastOutdoorSessionAt: sampledAt,
    };
  }

  const deltaMeters = distanceMeters(next.lastPosition, position);
  const minimumDisplacement = Math.max(
    MIN_MOVEMENT_SEGMENT_METERS,
    ((next.lastAccuracyMeters ?? options.accuracyMeters) +
      options.accuracyMeters) *
      0.75
  );
  if (deltaMeters < minimumDisplacement) return next;
  if (deltaMeters > MAX_MOVEMENT_SEGMENT_METERS) {
    return {
      ...next,
      lastPosition: position,
      lastSampleAt: sampledAt,
      lastAccuracyMeters: options.accuracyMeters,
      lastOutdoorSessionAt: sampledAt,
    };
  }

  const speedMps = deltaMeters / (gapMs / 1000);
  if (
    speedMps < MOTION_SPEED_THRESHOLD_MPS ||
    speedMps > MAX_WALKING_SPEED_MPS
  ) {
    return {
      ...next,
      lastPosition: position,
      lastSampleAt: sampledAt,
      lastAccuracyMeters: options.accuracyMeters,
    };
  }

  const minutes = gapMs / 60_000;
  const existingWindowStart = next.trailSurgeWindowStartedAt
    ? Date.parse(next.trailSurgeWindowStartedAt)
    : Number.NaN;
  const windowExpired =
    !Number.isFinite(existingWindowStart) ||
    Date.parse(sampledAt) - existingWindowStart > TRAIL_SURGE_WINDOW_MS;
  const trailSurgeWindowStartedAt = next.trailSurgeUnlockedToday
    ? next.trailSurgeWindowStartedAt
    : windowExpired
      ? sampledAt
      : next.trailSurgeWindowStartedAt;
  const trailSurgeWindowMeters = next.trailSurgeUnlockedToday
    ? next.trailSurgeWindowMeters
    : (windowExpired ? 0 : next.trailSurgeWindowMeters) + deltaMeters;
  const trailSurgeUnlockedToday =
    next.trailSurgeUnlockedToday ||
    trailSurgeWindowMeters >= TRAIL_SURGE_TARGET_METERS;

  return {
    ...next,
    totalMeters: next.totalMeters + deltaMeters,
    todayMeters: next.todayMeters + deltaMeters,
    totalMinutesInMotion: next.totalMinutesInMotion + minutes,
    todayMinutesInMotion: next.todayMinutesInMotion + minutes,
    trailSurgeWindowStartedAt,
    trailSurgeWindowMeters,
    trailSurgeUnlockedToday,
    lastOutdoorSessionAt: sampledAt,
    lastPosition: position,
    lastSampleAt: sampledAt,
    lastAccuracyMeters: options.accuracyMeters,
  };
}

export function recordOutingCompleted(ledger: MovementLedger): MovementLedger {
  return {
    ...ledger,
    outingsCompleted: ledger.outingsCompleted + 1,
  };
}
