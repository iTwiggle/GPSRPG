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
import { bearingDegrees } from "./distance";
import type { POI, Position } from "./types";

const POI_COUNT = 8;
const MIN_RADIUS_METERS = 120;
const MAX_RADIUS_METERS = 450;

/** Guaranteed reachable first site — leaves margin below the 150 m explore radius for GPS error. */
export const GUARANTEED_FIRST_POI_MIN_METERS = 70;
export const GUARANTEED_FIRST_POI_MAX_METERS = 110;

/** POIs regenerate only after crossing into a new ~400 m grid cell. */
export const POI_CELL_SIZE_METERS = 400;

export { getAreaCellKey };

function hashSeed(...values: number[]): number {
  let hash = 2166136261;
  for (const value of values) {
    const int = Math.floor(value * 1000);
    hash ^= int;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
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
  /**
   * When true, the whole field orbits the anchor (named place centroid)
   * instead of mixing player-near first site + cell-center ring.
   */
  placeAnchored?: boolean;
  /**
   * When place-anchored, bias the first site toward this approach point
   * (usually the player latch). Latched at field creation — stable for the field.
   */
  approachFrom?: Position | null;
}

/** Generate deterministic fantasy POIs near a GPS coordinate. */
export function generateNearbyPOIs(
  lat: number,
  lng: number,
  options: GenerateNearbyPOIsOptions = {}
): POI[] {
  const {
    count = POI_COUNT,
    areaContext = "generic",
    placeAnchored = false,
    approachFrom = null,
  } = options;
  const cell = getAreaCellKey(lat, lng);
  const { cellLat, cellLng } = cell;
  const { lat: cellCenterLat, lng: cellCenterLng } = getAreaCellCenter(cell);
  const categoryCode = getContextCategoryCode(areaContext);
  const placeBias = placeAnchored ? 1 : 0;
  const baseSeed = hashSeed(cellLat, cellLng, categoryCode, placeBias);
  const rand = seededRandom(baseSeed);

  const pois: POI[] = [];

  for (let i = 0; i < count; i += 1) {
    const typeRand = seededRandom(
      hashSeed(cellLat, cellLng, i, categoryCode, placeBias)
    );
    const type = pickPoiType(areaContext, typeRand);

    // Place fields: every site orbits the named landmark.
    // Player fields: first site near the player, rest around the cell center.
    const originLat = placeAnchored
      ? lat
      : i === 0
        ? lat
        : cellCenterLat;
    const originLng = placeAnchored
      ? lng
      : i === 0
        ? lng
        : cellCenterLng;

    const distance =
      i === 0
        ? GUARANTEED_FIRST_POI_MIN_METERS +
          rand() *
            (GUARANTEED_FIRST_POI_MAX_METERS - GUARANTEED_FIRST_POI_MIN_METERS)
        : MIN_RADIUS_METERS + rand() * (MAX_RADIUS_METERS - MIN_RADIUS_METERS);

    // One rand() either path — approach bias must not desync later site rolls.
    const bearingRoll = rand();
    const bearing =
      i === 0 &&
      placeAnchored &&
      approachFrom &&
      (approachFrom.lat !== originLat || approachFrom.lng !== originLng)
        ? (bearingDegrees(
            { lat: originLat, lng: originLng },
            approachFrom
          ) *
            Math.PI) /
            180 +
          (bearingRoll - 0.5) * (Math.PI / 2.5)
        : bearingRoll * Math.PI * 2;

    const offset = metersToLatLngOffset(originLat, distance, bearing);

    const nameRand = seededRandom(
      hashSeed(cellLat, cellLng, i, 1, categoryCode, placeBias)
    );
    const flavorRand = seededRandom(
      hashSeed(cellLat, cellLng, i, 2, categoryCode, placeBias)
    );

    pois.push({
      id: `poi-${cellLat.toFixed(6)}-${cellLng.toFixed(6)}-${i}${
        placeAnchored ? "-p" : ""
      }`,
      name: buildPoiName(type, nameRand, areaContext),
      type,
      flavor: pickPoiFlavor(type, flavorRand, areaContext),
      lat: originLat + offset.lat,
      lng: originLng + offset.lng,
    });
  }

  return pois;
}
