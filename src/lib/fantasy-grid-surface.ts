import type { OsmContextCategory } from "./osm-context";

export const FANTASY_GRID_SESSION_KEY = "gpsrpg-fantasy-grid";
export const STREET_REF_SESSION_KEY = "gpsrpg-street-ref";

/** Visual terrain mood for the fantasy grid overlay. */
export type FantasySurfaceBiome =
  | "wilds"
  | "grove"
  | "water"
  | "stone"
  | "settlement"
  | "shrine";

export interface FantasyBiomePalette {
  base: string;
  accent: string;
  highlight: string;
  border: string;
  rune: string;
  label: string;
}

export const FANTASY_GRID_TILE_METERS = 40;

const BIOME_PALETTES: Record<FantasySurfaceBiome, FantasyBiomePalette> = {
  wilds: {
    base: "#142218",
    accent: "#243d2a",
    highlight: "#2f5238",
    border: "rgba(120, 160, 120, 0.28)",
    rune: "rgba(167, 139, 250, 0.12)",
    label: "Wilds",
  },
  grove: {
    base: "#0f2618",
    accent: "#1a4528",
    highlight: "#276338",
    border: "rgba(74, 222, 128, 0.22)",
    rune: "rgba(134, 239, 172, 0.1)",
    label: "Grove",
  },
  water: {
    base: "#0a1e2e",
    accent: "#143d5c",
    highlight: "#1e5580",
    border: "rgba(56, 189, 248, 0.28)",
    rune: "rgba(125, 211, 252, 0.14)",
    label: "Rune Water",
  },
  stone: {
    base: "#1a1a22",
    accent: "#2e2e3a",
    highlight: "#454552",
    border: "rgba(168, 162, 158, 0.3)",
    rune: "rgba(148, 163, 184, 0.1)",
    label: "Ruins",
  },
  settlement: {
    base: "#221c14",
    accent: "#3d3424",
    highlight: "#524630",
    border: "rgba(251, 191, 36, 0.2)",
    rune: "rgba(251, 191, 36, 0.08)",
    label: "Cobble",
  },
  shrine: {
    base: "#1a1428",
    accent: "#2d2248",
    highlight: "#3f3060",
    border: "rgba(167, 139, 250, 0.32)",
    rune: "rgba(196, 181, 253, 0.16)",
    label: "Shrine",
  },
};

/** Map coarse OSM category to a fantasy surface biome (read-only). */
export function mapCategoryToBiome(
  category: OsmContextCategory
): FantasySurfaceBiome {
  switch (category) {
    case "park_or_woods":
      return "grove";
    case "water":
      return "water";
    case "industrial":
      return "stone";
    case "commercial":
    case "transit":
    case "education":
      return "settlement";
    case "cemetery":
    case "worship":
      return "shrine";
    default:
      return "wilds";
  }
}

export function getBiomePalette(biome: FantasySurfaceBiome): FantasyBiomePalette {
  return BIOME_PALETTES[biome];
}

export function getBiomeLabel(biome: FantasySurfaceBiome): string {
  return BIOME_PALETTES[biome].label;
}

/** Stable hash for per-tile color variation within a biome. */
export function tileVariationHash(cellLat: number, cellLng: number): number {
  const n = Math.sin(cellLat * 12.9898 + cellLng * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/** Snap lat/lng to a meter-based grid cell origin (visual tiles only). */
export function snapToTileCell(
  lat: number,
  lng: number,
  tileMeters: number = FANTASY_GRID_TILE_METERS
): { cellLat: number; cellLng: number; latStep: number; lngStep: number } {
  const latStep = tileMeters / 111_320;
  const lngStep = tileMeters / (111_320 * Math.cos((lat * Math.PI) / 180));
  return {
    cellLat: Math.floor(lat / latStep) * latStep,
    cellLng: Math.floor(lng / lngStep) * lngStep,
    latStep,
    lngStep,
  };
}
