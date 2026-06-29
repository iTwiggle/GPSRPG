/** Matches poi-generator grid — kept here to avoid circular imports. */
const POI_CELL_SIZE_METERS = 400;

export type OsmContextCategory =
  | "cemetery"
  | "park_or_woods"
  | "water"
  | "industrial"
  | "education"
  | "worship"
  | "transit"
  | "commercial"
  | "generic";

export interface AreaCellKey {
  cellLat: number;
  cellLng: number;
}

export interface OsmContextResult {
  category: OsmContextCategory;
  fetchedAt: number;
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const FETCH_TIMEOUT_MS = 8_000;
const CACHE_KEY = "gpsrpg-osm-context-v1";
const SUCCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHED_CELLS = 30;

/** Human-friendly labels for the area flavor chip. */
export const AREA_FLAVOR_LABELS: Record<
  Exclude<OsmContextCategory, "generic">,
  string
> = {
  cemetery: "Cemetery",
  park_or_woods: "Grove",
  water: "Water",
  industrial: "Industrial",
  education: "Academy",
  worship: "Chapel",
  transit: "Crossroads",
  commercial: "Market",
};

const CATEGORY_PRIORITY: OsmContextCategory[] = [
  "worship",
  "cemetery",
  "water",
  "park_or_woods",
  "education",
  "transit",
  "industrial",
  "commercial",
  "generic",
];

const memoryCache = new Map<string, OsmContextResult>();
const inFlight = new Map<string, Promise<OsmContextResult>>();

export function getAreaCellKey(
  lat: number,
  lng: number
): AreaCellKey {
  const latStep = POI_CELL_SIZE_METERS / 111_320;
  const cellLat = Math.floor(lat / latStep) * latStep;
  const lngStep =
    POI_CELL_SIZE_METERS /
    (111_320 * Math.cos((cellLat * Math.PI) / 180));
  const cellLng = Math.floor(lng / lngStep) * lngStep;
  return { cellLat, cellLng };
}

export function cellKeyToString(cell: AreaCellKey): string {
  return `${cell.cellLat.toFixed(6)},${cell.cellLng.toFixed(6)}`;
}

/** Stable anchor at the center of a ~400 m grid cell (for POI placement). */
export function getAreaCellCenter(cell: AreaCellKey): {
  lat: number;
  lng: number;
} {
  const latStep = POI_CELL_SIZE_METERS / 111_320;
  const lngStep =
    POI_CELL_SIZE_METERS /
    (111_320 * Math.cos((cell.cellLat * Math.PI) / 180));
  return {
    lat: cell.cellLat + latStep / 2,
    lng: cell.cellLng + lngStep / 2,
  };
}

function cellToBbox(cell: AreaCellKey): {
  south: number;
  west: number;
  north: number;
  east: number;
} {
  const latStep = POI_CELL_SIZE_METERS / 111_320;
  const lngStep =
    POI_CELL_SIZE_METERS /
    (111_320 * Math.cos((cell.cellLat * Math.PI) / 180));
  return {
    south: cell.cellLat,
    west: cell.cellLng,
    north: cell.cellLat + latStep,
    east: cell.cellLng + lngStep,
  };
}

function categoryCode(category: OsmContextCategory): number {
  const index = CATEGORY_PRIORITY.indexOf(category);
  return index >= 0 ? index : CATEGORY_PRIORITY.length - 1;
}

export function getContextCategoryCode(
  category: OsmContextCategory
): number {
  return categoryCode(category);
}

export function getAreaFlavorLabel(
  category: OsmContextCategory
): string | null {
  if (category === "generic") return null;
  return AREA_FLAVOR_LABELS[category];
}

interface StoredCache {
  [cellKey: string]: OsmContextResult;
}

function readStorageCache(): StoredCache {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredCache;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorageCache(cache: StoredCache): void {
  if (typeof window === "undefined") return;
  try {
    const entries = Object.entries(cache).sort(
      ([, a], [, b]) => b.fetchedAt - a.fetchedAt
    );
    const trimmed = Object.fromEntries(entries.slice(0, MAX_CACHED_CELLS));
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore quota or privacy errors.
  }
}

function isCacheValid(
  entry: OsmContextResult,
  now: number
): boolean {
  const ttl =
    entry.category === "generic" ? FAILURE_TTL_MS : SUCCESS_TTL_MS;
  return now - entry.fetchedAt < ttl;
}

function getCachedContext(
  cellKey: string,
  now: number
): OsmContextResult | null {
  const memory = memoryCache.get(cellKey);
  if (memory && isCacheValid(memory, now)) {
    return memory;
  }

  const stored = readStorageCache()[cellKey];
  if (stored && isCacheValid(stored, now)) {
    memoryCache.set(cellKey, stored);
    return stored;
  }

  return null;
}

function storeContext(
  cellKey: string,
  result: OsmContextResult
): void {
  memoryCache.set(cellKey, result);
  const cache = readStorageCache();
  cache[cellKey] = result;
  writeStorageCache(cache);
}

function buildOverpassQuery(bbox: {
  south: number;
  west: number;
  north: number;
  east: number;
}): string {
  const { south, west, north, east } = bbox;
  const box = `${south},${west},${north},${east}`;
  return `[out:json][timeout:8];
(
  node["landuse"="cemetery"](${box});
  way["landuse"="cemetery"](${box});
  node["amenity"="grave_yard"](${box});
  way["amenity"="grave_yard"](${box});

  node["leisure"~"^(park|garden|nature_reserve)$"](${box});
  way["leisure"~"^(park|garden|nature_reserve)$"](${box});
  node["landuse"="forest"](${box});
  way["landuse"="forest"](${box});
  node["natural"="wood"](${box});
  way["natural"="wood"](${box});

  node["natural"="water"](${box});
  way["natural"="water"](${box});
  node["waterway"](${box});
  way["waterway"](${box});
  node["landuse"="reservoir"](${box});
  way["landuse"="reservoir"](${box});
  node["natural"="wetland"](${box});
  way["natural"="wetland"](${box});

  node["landuse"~"^(industrial|quarry)$"](${box});
  way["landuse"~"^(industrial|quarry)$"](${box});
  node["man_made"="works"](${box});
  way["man_made"="works"](${box});

  node["amenity"~"^(school|college|university|library)$"](${box});
  way["amenity"~"^(school|college|university|library)$"](${box});

  node["amenity"="place_of_worship"](${box});
  way["amenity"="place_of_worship"](${box});

  node["railway"~"^(station|halt)$"](${box});
  way["railway"~"^(station|halt)$"](${box});
  node["public_transport"="station"](${box});
  way["public_transport"="station"](${box});
  node["amenity"="bus_station"](${box});
  way["amenity"="bus_station"](${box});

  node["landuse"~"^(commercial|retail)$"](${box});
  way["landuse"~"^(commercial|retail)$"](${box});
  node["shop"](${box});
  way["shop"](${box});
);
out tags;`;
}

function classifyElementTags(
  tags: Record<string, string>
): OsmContextCategory | null {
  const landuse = tags.landuse;
  const amenity = tags.amenity;
  const leisure = tags.leisure;
  const natural = tags.natural;
  const waterway = tags.waterway;
  const railway = tags.railway;
  const publicTransport = tags.public_transport;
  const manMade = tags.man_made;
  const shop = tags.shop;

  if (
    landuse === "cemetery" ||
    amenity === "grave_yard" ||
    tags.historic === "tomb"
  ) {
    return "cemetery";
  }

  if (
    leisure === "park" ||
    leisure === "garden" ||
    leisure === "nature_reserve" ||
    landuse === "forest" ||
    natural === "wood"
  ) {
    return "park_or_woods";
  }

  if (
    natural === "water" ||
    natural === "wetland" ||
    landuse === "reservoir" ||
    Boolean(waterway)
  ) {
    return "water";
  }

  if (
    landuse === "industrial" ||
    landuse === "quarry" ||
    manMade === "works" ||
    Boolean(tags.industrial)
  ) {
    return "industrial";
  }

  if (
    amenity === "school" ||
    amenity === "college" ||
    amenity === "university" ||
    amenity === "library"
  ) {
    return "education";
  }

  if (amenity === "place_of_worship") {
    return "worship";
  }

  if (
    railway === "station" ||
    railway === "halt" ||
    publicTransport === "station" ||
    amenity === "bus_station"
  ) {
    return "transit";
  }

  if (
    landuse === "commercial" ||
    landuse === "retail" ||
    Boolean(shop) ||
    amenity === "restaurant" ||
    amenity === "cafe"
  ) {
    return "commercial";
  }

  return null;
}

export function classifyOsmElements(
  elements: Array<{ tags?: Record<string, string> }>
): OsmContextCategory {
  const counts = new Map<OsmContextCategory, number>();

  for (const element of elements) {
    if (!element.tags) continue;
    const category = classifyElementTags(element.tags);
    if (!category) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  if (counts.size === 0) {
    return "generic";
  }

  let bestCategory: OsmContextCategory = "generic";
  let bestCount = 0;
  let bestPriority = CATEGORY_PRIORITY.length;

  for (const [category, count] of counts) {
    const priority = categoryCode(category);
    if (
      count > bestCount ||
      (count === bestCount && priority < bestPriority)
    ) {
      bestCategory = category;
      bestCount = count;
      bestPriority = priority;
    }
  }

  return bestCategory;
}

async function fetchOsmContextForCell(
  cell: AreaCellKey
): Promise<OsmContextResult> {
  const bbox = cellToBbox(cell);
  const query = buildOverpassQuery(bbox);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    FETCH_TIMEOUT_MS
  );

  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Accept: "application/json",
        "User-Agent": "GPSRPG/0.1 (companion prototype)",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      elements?: Array<{ tags?: Record<string, string> }>;
    };
    const category = classifyOsmElements(payload.elements ?? []);

    return {
      category,
      fetchedAt: Date.now(),
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function getCachedOsmCategory(
  cell: AreaCellKey
): OsmContextCategory | null {
  const cached = getCachedContext(cellKeyToString(cell), Date.now());
  return cached?.category ?? null;
}

export async function resolveOsmContext(
  cell: AreaCellKey
): Promise<OsmContextResult> {
  const cellKey = cellKeyToString(cell);
  const now = Date.now();
  const cached = getCachedContext(cellKey, now);
  if (cached) {
    return cached;
  }

  const pending = inFlight.get(cellKey);
  if (pending) {
    return pending;
  }

  const request = fetchOsmContextForCell(cell)
    .then((result) => {
      storeContext(cellKey, result);
      return result;
    })
    .catch(() => {
      const fallback: OsmContextResult = {
        category: "generic",
        fetchedAt: Date.now(),
      };
      storeContext(cellKey, fallback);
      return fallback;
    })
    .finally(() => {
      inFlight.delete(cellKey);
    });

  inFlight.set(cellKey, request);
  return request;
}
