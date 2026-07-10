import { distanceMeters } from "./distance";
import type { OsmContextCategory } from "./osm-context";
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
  lat: number;
  lng: number;
  areaContext: OsmContextCategory;
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
    };
  } catch {
    return null;
  }
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
    distanceMeters(player, anchor) >= POI_ANCHOR_REGENERATE_METERS
  );
}

/** True when a persisted anchor should be discarded on startup for a new field. */
export function shouldReplaceStaleAnchorOnStartup(
  player: Position,
  anchor: PoiAnchorState
): boolean {
  return (
    distanceMeters(player, anchor) >= POI_ANCHOR_STALE_RELOCATION_METERS
  );
}

export function createPoiAnchor(
  player: Position,
  areaContext: OsmContextCategory
): PoiAnchorState {
  return {
    lat: player.lat,
    lng: player.lng,
    areaContext,
  };
}

export function metersUntilPoiRefresh(
  player: Position,
  anchor: PoiAnchorState
): number {
  const traveled = distanceMeters(player, anchor);
  return Math.max(0, POI_ANCHOR_REGENERATE_METERS - traveled);
}
