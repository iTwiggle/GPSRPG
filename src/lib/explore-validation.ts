import { isWithinRadius } from "./distance";
import { EXPLORE_RADIUS_METERS, type POI, type Position } from "./types";

export type ExploreBlockReason = "already_visited" | "out_of_range";

export interface ExploreValidationResult {
  ok: boolean;
  reason?: ExploreBlockReason;
}

export function canExplorePoi(
  player: Position,
  poi: POI,
  visitedPoiIds: string[],
  options?: { simulate?: boolean }
): ExploreValidationResult {
  if (visitedPoiIds.includes(poi.id) && !options?.simulate) {
    return { ok: false, reason: "already_visited" };
  }

  if (
    !options?.simulate &&
    !isWithinRadius(player, poi, EXPLORE_RADIUS_METERS)
  ) {
    return { ok: false, reason: "out_of_range" };
  }

  return { ok: true };
}
