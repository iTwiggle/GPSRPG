import { EXPLORATION_REVEAL_RADIUS_METERS } from "@/lib/exploration-memory";
import { getLocalDateString } from "@/lib/tasks";
import type { MovementLedger } from "@/lib/types";
import type { EncounterResult } from "@/lib/types";
import {
  TRAIL_SURGE_TARGET_METERS,
  TRAIL_SURGE_WINDOW_MS,
} from "./movement-ledger";

export const TRAIL_MOMENTUM_TARGET_METERS = 1_200;
export const SCOUTS_EYE_REVEAL_MULTIPLIER = 1.2;
export const TRAIL_SURGE_XP_MULTIPLIER = 0.1;

export interface TrailMomentumStatus {
  distanceMeters: number;
  targetMeters: number;
  remainingMeters: number;
  progressPercent: number;
  scoutsEyeActive: boolean;
  liveRevealRadiusMeters: number;
  trailSurgeActive: boolean;
  trailSurgeDistanceMeters: number;
  trailSurgeRemainingMeters: number;
  trailSurgeProgressPercent: number;
}

export function getTrailMomentumStatus(
  ledger: MovementLedger,
  today: string = getLocalDateString(),
  now: Date = new Date()
): TrailMomentumStatus {
  const distanceMeters = ledger.todayDate === today ? ledger.todayMeters : 0;
  const scoutsEyeActive = distanceMeters >= TRAIL_MOMENTUM_TARGET_METERS;
  const rawProgress = Math.floor((distanceMeters / TRAIL_MOMENTUM_TARGET_METERS) * 100);
  const surgeWindowAge = ledger.trailSurgeWindowStartedAt
    ? now.getTime() - Date.parse(ledger.trailSurgeWindowStartedAt)
    : Number.POSITIVE_INFINITY;
  const trailSurgeActive =
    ledger.todayDate === today && ledger.trailSurgeUnlockedToday;
  const trailSurgeDistanceMeters =
    ledger.todayDate === today &&
    (trailSurgeActive || surgeWindowAge <= TRAIL_SURGE_WINDOW_MS)
      ? ledger.trailSurgeWindowMeters
      : 0;
  const surgeProgress = Math.floor(
    (trailSurgeDistanceMeters / TRAIL_SURGE_TARGET_METERS) * 100
  );
  return {
    distanceMeters,
    targetMeters: TRAIL_MOMENTUM_TARGET_METERS,
    remainingMeters: Math.max(0, TRAIL_MOMENTUM_TARGET_METERS - distanceMeters),
    progressPercent: scoutsEyeActive ? 100 : Math.min(99, rawProgress),
    scoutsEyeActive,
    liveRevealRadiusMeters: scoutsEyeActive ? EXPLORATION_REVEAL_RADIUS_METERS * SCOUTS_EYE_REVEAL_MULTIPLIER : EXPLORATION_REVEAL_RADIUS_METERS,
    trailSurgeActive,
    trailSurgeDistanceMeters,
    trailSurgeRemainingMeters: Math.max(
      0,
      TRAIL_SURGE_TARGET_METERS - trailSurgeDistanceMeters
    ),
    trailSurgeProgressPercent: trailSurgeActive
      ? 100
      : Math.min(99, surgeProgress),
  };
}

export function applyTrailSurgeXp(
  encounter: EncounterResult,
  ledger: MovementLedger,
  previewActive = false
): { encounter: EncounterResult; bonusXp: number; message?: string } {
  if (!previewActive && !getTrailMomentumStatus(ledger).trailSurgeActive) {
    return { encounter, bonusXp: 0 };
  }

  const bonusXp = Math.max(
    1,
    Math.round(encounter.xpGained * TRAIL_SURGE_XP_MULTIPLIER)
  );
  return {
    encounter: { ...encounter, xpGained: encounter.xpGained + bonusXp },
    bonusXp,
    message: `Trail Surge: +${bonusXp} XP`,
  };
}
