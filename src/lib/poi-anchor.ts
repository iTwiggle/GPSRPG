import { distanceMeters } from "./distance";
import type { NamedOsmPlace, OsmContextCategory } from "./osm-context";
import { POI_CELL_SIZE_METERS } from "./poi-generator";
import type { Position } from "./types";

export const POI_ANCHOR_STORAGE_KEY = "gpsrpg-poi-anchor-v1";
/** @deprecated Migrated to localStorage — read for one-time upgrade only. */
const POI_ANCHOR_LEGACY_SESSION_KEY = POI_ANCHOR_STORAGE_KEY;

/** Regenerate the POI field after moving this far from the field anchor during play. */
export const POI_ANCHOR_REGENERATE_METERS = Math.round(
  POI_CELL_SIZE_METERS * 0.7
);

/**
 * On cold start, replace a persisted anchor when live GPS is farther than this.
 * Half a POI grid cell (~200 m): beyond normal GPS drift, but below the 280 m
 * walk-time refresh so a nearby reopen keeps the same field.
 */
export const POI_ANCHOR_STALE_RELOCATION_METERS = Math.round(
  POI_CELL_SIZE_METERS * 0.5
);

export interface PoiAnchorState {
  /** Field origin — named place centroid when placeAnchored, else player. */
  lat: number;
  lng: number;
  areaContext: OsmContextCategory;
  /** Real OSM place name when the field is keyed to a landmark. */
  placeName?: string | null;
  /** True when lat/lng is a named place centroid (not the player spawn point). */
  placeAnchored?: boolean;
  /** Player position when the field was locked — walk-refresh distance uses this. */
  playerLat?: number;
  playerLng?: number;
}

function parsePoiAnchor(raw: string): PoiAnchorState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PoiAnchorState>;
    if (
      typeof parsed.lat !== "number" ||
      typeof parsed.lng !== "number" ||
      typeof parsed.areaContext !== "string"
    ) {
      return null;
    }
    return {
      lat: parsed.lat,
      lng: parsed.lng,
      areaContext: parsed.areaContext as OsmContextCategory,
      placeName:
        typeof parsed.placeName === "string" ? parsed.placeName : null,
      placeAnchored: Boolean(parsed.placeAnchored),
      playerLat:
        typeof parsed.playerLat === "number" ? parsed.playerLat : undefined,
      playerLng:
        typeof parsed.playerLng === "number" ? parsed.playerLng : undefined,
    };
  } catch {
    return null;
  }
}

/** Origin used for walk-distance refresh (player latch, not place centroid). */
export function getAnchorRefreshOrigin(anchor: PoiAnchorState): Position {
  if (
    typeof anchor.playerLat === "number" &&
    typeof anchor.playerLng === "number"
  ) {
    return { lat: anchor.playerLat, lng: anchor.playerLng };
  }
  return { lat: anchor.lat, lng: anchor.lng };
}

export function readPoiAnchor(): PoiAnchorState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(POI_ANCHOR_STORAGE_KEY);
    if (stored) {
      return parsePoiAnchor(stored);
    }

    const legacy = sessionStorage.getItem(POI_ANCHOR_LEGACY_SESSION_KEY);
    if (!legacy) return null;

    const migrated = parsePoiAnchor(legacy);
    if (migrated) {
      writePoiAnchor(migrated);
      sessionStorage.removeItem(POI_ANCHOR_LEGACY_SESSION_KEY);
    }
    return migrated;
  } catch {
    return null;
  }
}

export function writePoiAnchor(anchor: PoiAnchorState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(POI_ANCHOR_STORAGE_KEY, JSON.stringify(anchor));
  } catch {
    // In-memory hook state still holds the anchor for this session.
  }
}

export function shouldRegeneratePoiAnchor(
  player: Position,
  anchor: PoiAnchorState | null
): boolean {
  if (!anchor) return true;
  return (
    distanceMeters(player, getAnchorRefreshOrigin(anchor)) >=
    POI_ANCHOR_REGENERATE_METERS
  );
}

/** True when a persisted anchor should be discarded on startup for a new field. */
export function shouldReplaceStaleAnchorOnStartup(
  player: Position,
  anchor: PoiAnchorState
): boolean {
  return (
    distanceMeters(player, getAnchorRefreshOrigin(anchor)) >=
    POI_ANCHOR_STALE_RELOCATION_METERS
  );
}

export function createPoiAnchor(
  player: Position,
  areaContext: OsmContextCategory,
  place?: NamedOsmPlace | null
): PoiAnchorState {
  if (place) {
    return {
      lat: place.lat,
      lng: place.lng,
      areaContext,
      placeName: place.name,
      placeAnchored: true,
      playerLat: player.lat,
      playerLng: player.lng,
    };
  }

  return {
    lat: player.lat,
    lng: player.lng,
    areaContext,
    placeName: null,
    placeAnchored: false,
    playerLat: player.lat,
    playerLng: player.lng,
  };
}

/**
 * When Overpass upgrades mood/place and the player has not explored this field,
 * regenerate so the aura chip and sites stay in sync.
 */
export function contextUpgradeNeedsRefresh(
  anchor: PoiAnchorState,
  nextCategory: OsmContextCategory,
  nextPlace: NamedOsmPlace | null
): boolean {
  // Keep a richer field if Overpass later fails soft into generic.
  if (anchor.areaContext !== "generic" && nextCategory === "generic") {
    return false;
  }

  if (anchor.areaContext !== nextCategory) {
    return true;
  }

  const nextName = nextPlace?.name ?? null;
  const prevName = anchor.placeName ?? null;
  if (nextName && nextName !== prevName) {
    return true;
  }

  // Named place centroid became available for an unanchored generic/mood field.
  if (nextPlace && !anchor.placeAnchored) {
    return true;
  }

  return false;
}

export function metersUntilPoiRefresh(
  player: Position,
  anchor: PoiAnchorState
): number {
  const traveled = distanceMeters(player, getAnchorRefreshOrigin(anchor));
  return Math.max(0, POI_ANCHOR_REGENERATE_METERS - traveled);
}
