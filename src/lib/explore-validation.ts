import { isWithinRadius } from "./distance";
import { canReExplorePoi, isLandmarkPoiType } from "./temporal/poi-cooldowns";
import {
  EXPLORE_RADIUS_METERS,
  type POI,
  type Position,
  type VisitedPoiState,
} from "./types";

export type ExploreBlockReason =
  | "already_visited"
  | "on_cooldown"
  | "out_of_range";

export interface ExploreValidationResult {
  ok: boolean;
  reason?: ExploreBlockReason;
}

export function canExplorePoi(
  player: Position,
  poi: POI,
  visitedPois: Record<string, VisitedPoiState>,
  options?: { simulate?: boolean }
): ExploreValidationResult {
  const visit = visitedPois[poi.id];

  if (!options?.simulate && visit) {
    if (!canReExplorePoi(visit, poi.type)) {
      return {
        ok: false,
        reason: isLandmarkPoiType(poi.type)
          ? "already_visited"
          : "on_cooldown",
      };
    }
  }

  if (
    !options?.simulate &&
    !isWithinRadius(player, poi, EXPLORE_RADIUS_METERS)
  ) {
    return { ok: false, reason: "out_of_range" };
  }

  return { ok: true };
}
