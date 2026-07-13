export type FantasyMapBiome =
  | "wilds"
  | "grove"
  | "water"
  | "stone"
  | "settlement"
  | "shrine";

export type FantasyMapMotif =
  | "tree-cluster"
  | "grass-scrub"
  | "rock-cluster"
  | "reeds"
  | "wave-mark"
  | "ruin-wall"
  | "hamlet-roof"
  | "standing-stones"
  | "dead-tree"
  | "path-stones";

export interface FantasyMapPlacement {
  id: string;
  lat: number;
  lng: number;
  biome: FantasyMapBiome;
  motif: FantasyMapMotif;
  scale: number;
  rotationDegrees: number;
  opacity: number;
}

export interface FantasyMapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface FantasyMapTerrainCell {
  id: string;
  row: number;
  column: number;
  south: number;
  west: number;
  north: number;
  east: number;
  centerLat: number;
  centerLng: number;
  biome: FantasyMapBiome;
  variation: number;
}

export const FANTASY_ATLAS_CHUNK_METERS = 180;
const REGION_CHUNKS = 3;

const REGION_BIOMES: FantasyMapBiome[] = [
  "wilds",
  "wilds",
  "grove",
  "grove",
  "stone",
  "settlement",
  "water",
  "shrine",
];

const MOTIF_POOLS: Record<FantasyMapBiome, FantasyMapMotif[]> = {
  wilds: [
    "grass-scrub",
    "grass-scrub",
    "rock-cluster",
    "tree-cluster",
    "dead-tree",
    "standing-stones",
  ],
  grove: [
    "tree-cluster",
    "tree-cluster",
    "tree-cluster",
    "grass-scrub",
    "dead-tree",
    "rock-cluster",
  ],
  water: ["wave-mark", "wave-mark", "reeds", "reeds", "rock-cluster"],
  stone: [
    "ruin-wall",
    "ruin-wall",
    "rock-cluster",
    "rock-cluster",
    "dead-tree",
    "standing-stones",
  ],
  settlement: [
    "hamlet-roof",
    "hamlet-roof",
    "path-stones",
    "path-stones",
    "ruin-wall",
    "grass-scrub",
  ],
  shrine: [
    "standing-stones",
    "standing-stones",
    "dead-tree",
    "ruin-wall",
    "grass-scrub",
  ],
};

function hashInts(a: number, b: number, salt: number): number {
  let hash = 2166136261;
  for (const value of [a, b, salt]) {
    hash ^= value | 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getRegionBiomeByIndex(
  regionRow: number,
  regionCol: number
): FantasyMapBiome {
  const seed = hashInts(regionRow, regionCol, 0x4f524e41);
  return REGION_BIOMES[seed % REGION_BIOMES.length];
}

function getRegionBiome(chunkRow: number, chunkCol: number): FantasyMapBiome {
  return getRegionBiomeByIndex(
    Math.floor(chunkRow / REGION_CHUNKS),
    Math.floor(chunkCol / REGION_CHUNKS)
  );
}

export function getFantasyAtlasTerrainCells(
  bounds: FantasyMapBounds
): FantasyMapTerrainCell[] {
  const latStep = FANTASY_ATLAS_CHUNK_METERS / 111_320;
  const startRow = Math.floor(bounds.south / latStep) - 1;
  const endRow = Math.floor(bounds.north / latStep) + 1;
  const cells: FantasyMapTerrainCell[] = [];

  for (let row = startRow; row <= endRow; row++) {
    const south = row * latStep;
    const north = south + latStep;
    const centerLat = south + latStep / 2;
    const lngStep =
      FANTASY_ATLAS_CHUNK_METERS /
      (111_320 * Math.cos((centerLat * Math.PI) / 180));
    const startCol = Math.floor(bounds.west / lngStep) - 1;
    const endCol = Math.floor(bounds.east / lngStep) + 1;

    for (let column = startCol; column <= endCol; column++) {
      const west = column * lngStep;
      const east = west + lngStep;

      cells.push({
        id: `${row}:${column}`,
        row,
        column,
        south,
        west,
        north,
        east,
        centerLat,
        centerLng: west + lngStep / 2,
        biome: getRegionBiome(row, column),
        variation: hashInts(row, column, 0x54455252) / 4_294_967_296,
      });
    }
  }

  return cells;
}

export function getFantasyAtlasPlacements(
  bounds: FantasyMapBounds
): FantasyMapPlacement[] {
  const latStep = FANTASY_ATLAS_CHUNK_METERS / 111_320;
  const startRow = Math.floor(bounds.south / latStep) - 1;
  const endRow = Math.floor(bounds.north / latStep) + 1;
  const placements: FantasyMapPlacement[] = [];

  for (let row = startRow; row <= endRow; row++) {
    const rowLat = row * latStep;
    const centerLat = rowLat + latStep / 2;
    const lngStep =
      FANTASY_ATLAS_CHUNK_METERS /
      (111_320 * Math.cos((centerLat * Math.PI) / 180));
    const startCol = Math.floor(bounds.west / lngStep) - 1;
    const endCol = Math.floor(bounds.east / lngStep) + 1;

    for (let col = startCol; col <= endCol; col++) {
      const biome = getRegionBiome(row, col);
      const pool = MOTIF_POOLS[biome];
      const rand = seededRandom(hashInts(row, col, 0x47505352));
      const count = 2 + Math.floor(rand() * 4);

      for (let index = 0; index < count; index++) {
        const northFraction = 0.06 + rand() * 0.88;
        const eastFraction = 0.06 + rand() * 0.88;
        const motif = pool[Math.floor(rand() * pool.length)];
        const lat = rowLat + northFraction * latStep;
        const lng = col * lngStep + eastFraction * lngStep;

        placements.push({
          id: `${row}:${col}:${index}`,
          lat,
          lng,
          biome,
          motif,
          scale: 0.82 + rand() * 0.5,
          rotationDegrees: -12 + rand() * 24,
          opacity: 0.72 + rand() * 0.22,
        });
      }
    }
  }

  return placements.filter(
    (placement) =>
      placement.lat >= bounds.south &&
      placement.lat <= bounds.north &&
      placement.lng >= bounds.west &&
      placement.lng <= bounds.east
  );
}
