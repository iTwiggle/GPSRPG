import { distanceMeters } from "./distance";
import {
  AREA_FLAVOR_LABELS,
  type NamedOsmPlace,
  type OsmContextCategory,
} from "./osm-context";
import { getDominantPoiTypeForCategory, getPoiTypeLabel } from "./poi-flavor";
import { generateNearbyPOIs } from "./poi-generator";
import type { Position } from "./types";

/** How far a named place can be and still tease as a destination. */
export const SCOUT_RADIUS_METERS = 1_500;

/** Sealed-site count for an untouched place field. */
export const SCOUT_SEALED_SITE_COUNT = 8;

const AFFINITY_HINTS: Record<
  Exclude<OsmContextCategory, "generic">,
  string
> = {
  cemetery: "shrine affinity stirs",
  park_or_woods: "grove affinity stirs",
  water: "well affinity stirs",
  industrial: "quarry affinity stirs",
  education: "cache affinity stirs",
  worship: "shrine affinity stirs",
  transit: "gate affinity stirs",
  commercial: "cache affinity stirs",
};

export interface ScoutReadout {
  place: NamedOsmPlace;
  auraLabel: string;
  sealedSites: number;
  affinityHint: string;
  distanceMeters: number;
  /** Compact scanner line — no site/loot names. */
  headline: string;
}

export function getAffinityHintForCategory(
  category: Exclude<OsmContextCategory, "generic">
): string {
  return AFFINITY_HINTS[category];
}

/** Count sealed (unexplored) sites for a place-anchored field preview. */
export function countSealedSitesForPlace(
  place: NamedOsmPlace,
  visitedPoiIds: readonly string[] = []
): number {
  const pois = generateNearbyPOIs(place.lat, place.lng, {
    areaContext: place.category,
    placeAnchored: true,
  });
  if (visitedPoiIds.length === 0) {
    return pois.length;
  }
  return pois.filter((poi) => !visitedPoiIds.includes(poi.id)).length;
}

export function buildScoutReadout(
  place: NamedOsmPlace,
  player: Position,
  visitedPoiIds: readonly string[] = []
): ScoutReadout {
  const auraLabel = AREA_FLAVOR_LABELS[place.category];
  const sealedSites = countSealedSitesForPlace(place, visitedPoiIds);
  const affinityHint = getAffinityHintForCategory(place.category);
  const dist = Math.round(distanceMeters(player, place));

  return {
    place,
    auraLabel,
    sealedSites,
    affinityHint,
    distanceMeters: dist,
    headline: `Scanner: ${auraLabel} · ${sealedSites} sealed site${
      sealedSites === 1 ? "" : "s"
    } · ${affinityHint}`,
  };
}

/** Short secondary line for the scout panel — still spoiler-safe. */
export function getScoutTeaserLine(place: NamedOsmPlace): string {
  const typeLabel = getPoiTypeLabel(
    getDominantPoiTypeForCategory(place.category)
  );
  return `${place.name} hums with veiled ${typeLabel.toLowerCase()} auras — walk in to claim first footfall.`;
}

export function isPlaceWithinScoutRange(
  player: Position,
  place: NamedOsmPlace,
  radiusMeters: number = SCOUT_RADIUS_METERS
): boolean {
  return distanceMeters(player, place) <= radiusMeters;
}

/**
 * Pick the best scout target near the map focus: closest unvisited named place
 * within scout range of the player (excluding the active field place).
 */
export function pickScoutTarget(options: {
  player: Position;
  focus: Position;
  candidates: readonly NamedOsmPlace[];
  discoveredPlaceIds: readonly string[];
  /** Active field place — already underfoot, not a destination teaser. */
  activePlaceId?: string | null;
  radiusMeters?: number;
}): NamedOsmPlace | null {
  const {
    player,
    focus,
    candidates,
    discoveredPlaceIds,
    activePlaceId = null,
    radiusMeters = SCOUT_RADIUS_METERS,
  } = options;

  const discovered = new Set(discoveredPlaceIds);
  let best: NamedOsmPlace | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const place of candidates) {
    if (discovered.has(place.id)) continue;
    if (activePlaceId && place.id === activePlaceId) continue;
    if (!isPlaceWithinScoutRange(player, place, radiusMeters)) continue;

    // Prefer places near the map focus, then nearer the player.
    const toFocus = distanceMeters(focus, place);
    const toPlayer = distanceMeters(player, place);
    const score = toFocus + toPlayer * 0.25;
    if (score < bestScore) {
      bestScore = score;
      best = place;
    }
  }

  return best;
}
