import { getAreaFlavorLabel, type OsmContextCategory } from "./osm-context";
import { getPoiTypeLabel } from "./poi-flavor";
import type { POI } from "./types";

/** Unexplored sites stay veiled — name and flavor unlock on Explore. */
export function isPoiRevealed(
  poiId: string,
  visitedPoiIds: readonly string[]
): boolean {
  return visitedPoiIds.includes(poiId);
}

export function getVeiledSiteTitle(
  areaContext: OsmContextCategory = "generic"
): string {
  const aura = getAreaFlavorLabel(areaContext);
  return aura ? `Veiled ${aura}` : "Veiled site";
}

export function getPoiDisplayName(
  poi: POI,
  revealed: boolean,
  areaContext: OsmContextCategory = "generic"
): string {
  if (revealed) return poi.name;
  return getVeiledSiteTitle(areaContext);
}

export function getPoiDisplayFlavor(poi: POI, revealed: boolean): string {
  if (revealed) return poi.flavor;
  return "A faint aura marks this place. Explore to uncover its true name.";
}

export function getPoiDisplayTypeLabel(poi: POI, revealed: boolean): string {
  if (revealed) return getPoiTypeLabel(poi.type);
  return "Unknown aura";
}
