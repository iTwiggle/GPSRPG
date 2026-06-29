import {
  buildPoiName,
  pickPoiFlavor,
  POI_TYPES,
} from "./poi-flavor";
import type { POI } from "./types";

const POI_COUNT = 8;
const MIN_RADIUS_METERS = 120;
const MAX_RADIUS_METERS = 450;

/** POIs regenerate only after crossing into a new ~400 m grid cell. */
export const POI_CELL_SIZE_METERS = 400;

function getAreaCellKey(
  lat: number,
  lng: number
): { cellLat: number; cellLng: number } {
  const latStep = POI_CELL_SIZE_METERS / 111_320;
  const cellLat = Math.floor(lat / latStep) * latStep;
  const lngStep =
    POI_CELL_SIZE_METERS /
    (111_320 * Math.cos((cellLat * Math.PI) / 180));
  const cellLng = Math.floor(lng / lngStep) * lngStep;
  return { cellLat, cellLng };
}

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

/** Generate deterministic fantasy POIs near a GPS coordinate. */
export function generateNearbyPOIs(
  lat: number,
  lng: number,
  count: number = POI_COUNT
): POI[] {
  const { cellLat, cellLng } = getAreaCellKey(lat, lng);
  const baseSeed = hashSeed(cellLat, cellLng);
  const rand = seededRandom(baseSeed);

  const pois: POI[] = [];

  for (let i = 0; i < count; i += 1) {
    const type = POI_TYPES[Math.floor(rand() * POI_TYPES.length)];
    const distance =
      MIN_RADIUS_METERS + rand() * (MAX_RADIUS_METERS - MIN_RADIUS_METERS);
    const bearing = rand() * Math.PI * 2;
    const offset = metersToLatLngOffset(lat, distance, bearing);

    const nameRand = seededRandom(hashSeed(cellLat, cellLng, i, 1));
    const flavorRand = seededRandom(hashSeed(cellLat, cellLng, i, 2));

    pois.push({
      id: `poi-${cellLat.toFixed(6)}-${cellLng.toFixed(6)}-${i}`,
      name: buildPoiName(type, nameRand),
      type,
      flavor: pickPoiFlavor(type, flavorRand),
      lat: lat + offset.lat,
      lng: lng + offset.lng,
    });
  }

  return pois;
}
