import { distanceMeters } from "./distance";
import { EXPLORE_RADIUS_METERS, type POI, type Position } from "./types";

/** Distance at which a selected site is considered "Nearby" (above explore range). */
export const APPROACH_NEARBY_THRESHOLD_METERS = 250;

export type ApproachStatus = "far" | "nearby" | "in_range";

export interface ApproachReadout {
  distanceMeters: number;
  status: ApproachStatus;
  /** 0–1 progress toward exploration range (1 = in range). */
  progress: number;
  exploreRadiusMeters: number;
}

export function getApproachStatus(
  distance: number,
  exploreRadiusMeters: number = EXPLORE_RADIUS_METERS
): ApproachStatus {
  if (distance <= exploreRadiusMeters) return "in_range";
  if (distance <= APPROACH_NEARBY_THRESHOLD_METERS) return "nearby";
  return "far";
}

/**
 * Progress toward exploration range. Reaches 1.0 when within explore radius.
 * Uses exploreRadius / distance so the bar fills as the player closes in.
 */
export function getApproachProgress(
  distance: number,
  exploreRadiusMeters: number = EXPLORE_RADIUS_METERS
): number {
  if (distance <= exploreRadiusMeters) return 1;
  return Math.max(0, Math.min(1, exploreRadiusMeters / distance));
}

export function getApproachReadout(
  player: { lat: number; lng: number },
  target: { lat: number; lng: number },
  exploreRadiusMeters: number = EXPLORE_RADIUS_METERS
): ApproachReadout {
  const dist = distanceMeters(player, target);
  return {
    distanceMeters: dist,
    status: getApproachStatus(dist, exploreRadiusMeters),
    progress: getApproachProgress(dist, exploreRadiusMeters),
    exploreRadiusMeters,
  };
}

export const APPROACH_STATUS_LABEL: Record<ApproachStatus, string> = {
  far: "Far",
  nearby: "Nearby",
  in_range: "In range",
};

export function findNearestPoi(
  player: Position,
  pois: POI[]
): POI | null {
  if (pois.length === 0) return null;

  let nearest: POI | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const poi of pois) {
    const dist = distanceMeters(player, poi);
    if (dist < nearestDistance) {
      nearest = poi;
      nearestDistance = dist;
    }
  }

  return nearest;
}
