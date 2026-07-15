import {
  EXPLORATION_REVEAL_RADIUS_METERS,
  explorationCellKey,
  getExplorationCell,
} from "./exploration-memory";
import { distanceMeters } from "./distance";
import type { POI, Position } from "./types";

interface DiscoverablePoisOptions {
  pois: POI[];
  playerPosition: Position;
  revealedCellKeys: string[];
  fogOfWarEnabled: boolean;
  liveRevealRadiusMeters?: number;
}

/**
 * Return the single POI discovery set consumed by every player-facing surface.
 * The live reveal footprint is included immediately while the exploration hook
 * persists those same cells for future visits.
 */
export function getDiscoverablePois({
  pois,
  playerPosition,
  revealedCellKeys,
  fogOfWarEnabled,
  liveRevealRadiusMeters = EXPLORATION_REVEAL_RADIUS_METERS,
}: DiscoverablePoisOptions): POI[] {
  if (!fogOfWarEnabled) return pois;

  const discoverableCellKeys = new Set(revealedCellKeys);

  return pois.filter(
    (poi) =>
      distanceMeters(playerPosition, poi) <=
        liveRevealRadiusMeters ||
      discoverableCellKeys.has(explorationCellKey(getExplorationCell(poi)))
  );
}
