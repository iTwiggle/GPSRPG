import {
  buildPoiName,
  pickPoiFlavor,
  pickPoiType,
} from "./poi-flavor";
import {
  getAreaCellCenter,
  getAreaCellKey,
  getContextCategoryCode,
  type OsmContextCategory,
} from "./osm-context";
import { seededRandom } from "./random";
import type { POI } from "./types";

const POI_COUNT = 8;
const MIN_RADIUS_METERS = 120;
const MAX_RADIUS_METERS = 450;

/** POIs regenerate only after crossing into a new ~400 m grid cell. */
export const POI_CELL_SIZE_METERS = 400;

export { getAreaCellKey };

/**
 * Numeric-only seed hash used for POI generation.
 * Kept local (not shared random.hashSeed) so existing world seeds stay stable.
 */
function hashSeed(...values: number[]): number {
  let hash = 2166136261;
  for (const value of values) {
    const int = Math.floor(value * 1000);
    hash ^= int;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function metersToLatLngOffset(
  originLat: number,
  distanceMeters: number,
  bearingRadians: number
): { lat: number; lng: number } {
  const latOffset =
    (distanceMeters * Math.cos(bearingRadians)) / 111_320;
  const lngOffset =
    (distanceMeters * Math.sin(bearingRadians)) /
    (111_320 * Math.cos((originLat * Math.PI) / 180));

  return { lat: latOffset, lng: lngOffset };
}

export interface GenerateNearbyPOIsOptions {
  count?: number;
  areaContext?: OsmContextCategory;
}

/** Generate deterministic fantasy POIs near a GPS coordinate. */
export function generateNearbyPOIs(
  lat: number,
  lng: number,
  options: GenerateNearbyPOIsOptions = {}
): POI[] {
  const { count = POI_COUNT, areaContext = "generic" } = options;
  const cell = getAreaCellKey(lat, lng);
  const { cellLat, cellLng } = cell;
  const { lat: anchorLat, lng: anchorLng } = getAreaCellCenter(cell);
  const categoryCode = getContextCategoryCode(areaContext);
  const baseSeed = hashSeed(cellLat, cellLng);
  const rand = seededRandom(baseSeed);

  const pois: POI[] = [];

  for (let i = 0; i < count; i += 1) {
    const typeRand = seededRandom(
      hashSeed(cellLat, cellLng, i, categoryCode)
    );
    const type = pickPoiType(areaContext, typeRand);
    const distance =
      MIN_RADIUS_METERS + rand() * (MAX_RADIUS_METERS - MIN_RADIUS_METERS);
    const bearing = rand() * Math.PI * 2;
    const offset = metersToLatLngOffset(anchorLat, distance, bearing);

    const nameRand = seededRandom(
      hashSeed(cellLat, cellLng, i, 1, categoryCode)
    );
    const flavorRand = seededRandom(
      hashSeed(cellLat, cellLng, i, 2, categoryCode)
    );

    pois.push({
      id: `poi-${cellLat.toFixed(6)}-${cellLng.toFixed(6)}-${i}`,
      name: buildPoiName(type, nameRand, areaContext),
      type,
      flavor: pickPoiFlavor(type, flavorRand, areaContext),
      lat: anchorLat + offset.lat,
      lng: anchorLng + offset.lng,
    });
  }

  return pois;
}
