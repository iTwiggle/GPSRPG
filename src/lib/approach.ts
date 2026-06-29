import { EXPLORE_RADIUS_METERS } from "./types";

export type ApproachStatus = "out_of_range" | "nearby" | "in_range";

export const APPROACH_NEARBY_MAX_METERS = 250;
export const APPROACH_PROGRESS_MAX_METERS = 400;
export const APPROACH_BEARING_HIDE_METERS = 15;

export function getApproachStatus(distanceMeters: number): ApproachStatus {
  if (distanceMeters <= EXPLORE_RADIUS_METERS) {
    return "in_range";
  }
  if (distanceMeters <= APPROACH_NEARBY_MAX_METERS) {
    return "nearby";
  }
  return "out_of_range";
}

export function getApproachLabel(status: ApproachStatus): string {
  switch (status) {
    case "in_range":
      return "In range";
    case "nearby":
      return "Nearby";
    case "out_of_range":
      return "Out of range";
  }
}

/** Progress toward exploration range (0 at progress max, 1 at or inside explore radius). */
export function getApproachProgress(distanceMeters: number): number {
  if (distanceMeters <= EXPLORE_RADIUS_METERS) {
    return 1;
  }

  const span = APPROACH_PROGRESS_MAX_METERS - EXPLORE_RADIUS_METERS;
  if (span <= 0) {
    return 1;
  }

  const raw =
    1 - (distanceMeters - EXPLORE_RADIUS_METERS) / span;
  return Math.max(0, Math.min(1, raw));
}
