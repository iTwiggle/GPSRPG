import type { POI, POIType } from "./types";

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

const POI_TYPES: POIType[] = [
  "ruins",
  "shrine",
  "cave",
  "tower",
  "camp",
  "forest",
  "lake",
];

const NAME_PARTS: Record<POIType, string[]> = {
  ruins: ["Forgotten", "Crumbling", "Ancient", "Lost"],
  shrine: ["Moonlit", "Whispering", "Sacred", "Hidden"],
  cave: ["Gloomy", "Echoing", "Crystal", "Shadow"],
  tower: ["Broken", "Ivory", "Warded", "Lonely"],
  camp: ["Bandit", "Nomad", "Abandoned", "Forsaken"],
  forest: ["Thorn", "Misty", "Enchanted", "Dark"],
  lake: ["Still", "Mirror", "Haunted", "Sunken"],
};

const NAME_SUFFIXES: Record<POIType, string[]> = {
  ruins: ["Ruins", "Keep", "Hall", "Vestige"],
  shrine: ["Shrine", "Altar", "Grove", "Sanctum"],
  cave: ["Cavern", "Grotto", "Den", "Hollow"],
  tower: ["Spire", "Watchtower", "Bastion", "Pinnacle"],
  camp: ["Camp", "Outpost", "Hideout", "Bivouac"],
  forest: ["Thicket", "Woods", "Glade", "Copse"],
  lake: ["Pool", "Lagoon", "Bend", "Shore"],
};

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

function buildPoiName(type: POIType, rand: () => number): string {
  const parts = NAME_PARTS[type];
  const suffixes = NAME_SUFFIXES[type];
  const prefix = parts[Math.floor(rand() * parts.length)];
  const suffix = suffixes[Math.floor(rand() * suffixes.length)];
  return `${prefix} ${suffix}`;
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

    pois.push({
      id: `poi-${cellLat.toFixed(6)}-${cellLng.toFixed(6)}-${i}`,
      name: buildPoiName(type, rand),
      type,
      lat: lat + offset.lat,
      lng: lng + offset.lng,
    });
  }

  return pois;
}
