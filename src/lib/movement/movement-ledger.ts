import { distanceMeters } from "@/lib/distance";
import { getLocalDateString } from "@/lib/tasks";
import type { MovementLedger, Position } from "@/lib/types";

export const METERS_PER_LEAGUE = 1000;
export const MOTION_SPEED_THRESHOLD_MPS = 0.5;
export const MAX_SAMPLE_GAP_MS = 60_000;

export function createEmptyMovementLedger(): MovementLedger {
  const today = getLocalDateString();
  return {
    totalMeters: 0,
    todayMeters: 0,
    todayDate: today,
    totalMinutesInMotion: 0,
    todayMinutesInMotion: 0,
    outingsCompleted: 0,
    lastOutdoorSessionAt: null,
  };
}

export function normalizeMovementLedger(
  ledger: Partial<MovementLedger> | undefined
): MovementLedger {
  const empty = createEmptyMovementLedger();
  if (!ledger) return empty;

  const today = getLocalDateString();
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
    lastPosition: ledger.lastPosition,
    lastSampleAt: ledger.lastSampleAt,
  };
}

export function metersToLeagues(meters: number): number {
  return Math.round((meters / METERS_PER_LEAGUE) * 10) / 10;
}

export function sampleMovementLedger(
  ledger: MovementLedger,
  position: Position,
  sampledAt: string = new Date().toISOString()
): MovementLedger {
  const today = getLocalDateString(new Date(sampledAt));
  let next = normalizeMovementLedger(ledger);

  if (next.todayDate !== today) {
    next = {
      ...next,
      todayDate: today,
      todayMeters: 0,
      todayMinutesInMotion: 0,
    };
  }

  if (!next.lastPosition || !next.lastSampleAt) {
    return {
      ...next,
      lastPosition: position,
      lastSampleAt: sampledAt,
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
      lastOutdoorSessionAt: sampledAt,
    };
  }

  const deltaMeters = distanceMeters(next.lastPosition, position);
  const speedMps = deltaMeters / (gapMs / 1000);
  if (speedMps < MOTION_SPEED_THRESHOLD_MPS) {
    return {
      ...next,
      lastPosition: position,
      lastSampleAt: sampledAt,
    };
  }

  const minutes = gapMs / 60_000;

  return {
    ...next,
    totalMeters: next.totalMeters + deltaMeters,
    todayMeters: next.todayMeters + deltaMeters,
    totalMinutesInMotion: next.totalMinutesInMotion + minutes,
    todayMinutesInMotion: next.todayMinutesInMotion + minutes,
    lastOutdoorSessionAt: sampledAt,
    lastPosition: position,
    lastSampleAt: sampledAt,
  };
}

export function recordOutingCompleted(ledger: MovementLedger): MovementLedger {
  return {
    ...ledger,
    outingsCompleted: ledger.outingsCompleted + 1,
  };
}
