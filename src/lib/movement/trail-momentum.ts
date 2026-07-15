import { EXPLORATION_REVEAL_RADIUS_METERS } from "@/lib/exploration-memory";
import { getLocalDateString } from "@/lib/tasks";
import type { MovementLedger } from "@/lib/types";

export const TRAIL_MOMENTUM_TARGET_METERS = 1_200;
export const SCOUTS_EYE_REVEAL_MULTIPLIER = 1.2;

export interface TrailMomentumStatus {
  distanceMeters: number;
  targetMeters: number;
  remainingMeters: number;
  progressPercent: number;
  scoutsEyeActive: boolean;
  liveRevealRadiusMeters: number;
}

export function getTrailMomentumStatus(ledger: MovementLedger, today: string = getLocalDateString()): TrailMomentumStatus {
  const distanceMeters = ledger.todayDate === today ? ledger.todayMeters : 0;
  const scoutsEyeActive = distanceMeters >= TRAIL_MOMENTUM_TARGET_METERS;
  const rawProgress = Math.floor((distanceMeters / TRAIL_MOMENTUM_TARGET_METERS) * 100);
  return {
    distanceMeters,
    targetMeters: TRAIL_MOMENTUM_TARGET_METERS,
    remainingMeters: Math.max(0, TRAIL_MOMENTUM_TARGET_METERS - distanceMeters),
    progressPercent: scoutsEyeActive ? 100 : Math.min(99, rawProgress),
    scoutsEyeActive,
    liveRevealRadiusMeters: scoutsEyeActive ? EXPLORATION_REVEAL_RADIUS_METERS * SCOUTS_EYE_REVEAL_MULTIPLIER : EXPLORATION_REVEAL_RADIUS_METERS,
  };
}
