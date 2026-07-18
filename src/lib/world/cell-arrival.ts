import { findNearestPoi } from "@/lib/approach";
import { distanceMeters, formatDistance } from "@/lib/distance";
import {
  getCraftRecipeStatus,
  type CraftIngredientStatus,
} from "@/lib/companion/sanctum-craft";
import { getAreaFlavorLabel } from "@/lib/osm-context";
import type { OsmContextCategory } from "@/lib/osm-context";
import type { GameState, POI, POIType, Position } from "@/lib/types";

export interface CellArrivalBrief {
  cellKey: string;
  placeLabel: string;
  placeCategory: OsmContextCategory;
  headline: string;
  forageHint: string | null;
  craftNudge: string | null;
}

const FORAGE_POI_TYPES = new Set<POIType>(["grove", "well", "cache"]);

function formatCraftGap(ingredients: CraftIngredientStatus[]): string {
  const missing = ingredients.filter((ingredient) => ingredient.shortfall > 0);
  if (missing.length === 0) return "Ready to craft at the citadel";
  return missing
    .map((gap) => `${gap.shortfall} more ${gap.label}`)
    .join(" · ");
}

export function hasSeenFootfall(
  state: GameState,
  cellKey: string
): boolean {
  return state.companionMeta?.footfallCellKeys?.includes(cellKey) ?? false;
}

export function markFootfallSeen(
  state: GameState,
  cellKey: string
): GameState {
  const existing = state.companionMeta?.footfallCellKeys ?? [];
  if (existing.includes(cellKey)) return state;

  return {
    ...state,
    companionMeta: {
      ...state.companionMeta,
      footfallCellKeys: [...existing, cellKey],
    },
  };
}

export function buildCellArrivalBrief(input: {
  state: GameState;
  cellKey: string;
  placeCategory: OsmContextCategory;
  pois: POI[];
  playerPosition: Position;
}): CellArrivalBrief {
  const placeLabel =
    input.placeCategory === "generic"
      ? "Unknown wilds"
      : (getAreaFlavorLabel(input.placeCategory) ?? "Unknown wilds");

  const forageSites = input.pois.filter((poi) => FORAGE_POI_TYPES.has(poi.type));
  const nearest = findNearestPoi(input.playerPosition, forageSites);

  let forageHint: string | null = null;
  if (input.pois.length > 0) {
    const target =
      nearest ??
      input.pois.find((poi) => poi.type === "grove") ??
      input.pois[0];
    if (target) {
      const distance = formatDistance(
        distanceMeters(input.playerPosition, target)
      );
      forageHint = `Nearest forage site: ${target.name} · ${distance}`;
    }
  }

  const healing = getCraftRecipeStatus(input.state, "healing-potion");
  const craftNudge = healing ? formatCraftGap(healing.ingredients) : null;

  const headline =
    input.placeCategory === "marsh"
      ? "First footfall in the marsh — blooms may be close."
      : `First footfall in ${placeLabel.toLowerCase()}.`;

  return {
    cellKey: input.cellKey,
    placeLabel,
    placeCategory: input.placeCategory,
    headline,
    forageHint,
    craftNudge,
  };
}
