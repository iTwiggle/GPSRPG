import { distanceMeters } from "./distance";
import type { OsmContextCategory } from "./osm-context";
import { POI_CELL_SIZE_METERS } from "./poi-generator";
import type { Position } from "./types";

export const POI_ANCHOR_SESSION_KEY = "gpsrpg-poi-anchor-v1";

/** Regenerate the POI field after moving this far from the session anchor. */
export const POI_ANCHOR_REGENERATE_METERS = Math.round(
  POI_CELL_SIZE_METERS * 0.7
);

export interface PoiAnchorState {
  lat: number;
  lng: number;
  areaContext: OsmContextCategory;
}

export function readPoiAnchor(): PoiAnchorState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(POI_ANCHOR_SESSION_KEY);
    if (!raw) return null;
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

export function writePoiAnchor(anchor: PoiAnchorState): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(POI_ANCHOR_SESSION_KEY, JSON.stringify(anchor));
  } catch {
    // Session-only fallback is handled by in-memory hook state.
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

export function metersUntilPoiRefresh(
  player: Position,
  anchor: PoiAnchorState
): number {
  const traveled = distanceMeters(player, anchor);
  return Math.max(0, POI_ANCHOR_REGENERATE_METERS - traveled);
}
