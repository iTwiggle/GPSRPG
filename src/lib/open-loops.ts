import { countReadyDepotDoors } from "@/lib/base-camp";
import {
  HEALING_DRAUGHT_CATALOG_ID,
  isClearSightActive,
} from "@/lib/companion/clear-sight";
import { getCraftRecipeStatus } from "@/lib/companion/sanctum-craft";
import { getAlmostCompleteSets } from "@/lib/item-catalog";
import { findNearestPoi } from "@/lib/approach";
import { SCOUTS_EYE_REVEAL_BONUS_METERS } from "@/lib/movement/trail-momentum";
import { canReExplorePoi } from "@/lib/temporal/poi-cooldowns";
import type { OsmContextCategory } from "@/lib/osm-context";
import type { Codex, GameState, POI, Position } from "@/lib/types";

export interface OpenLoopNudge {
  id: string;
  message: string;
  tone: "amber" | "violet" | "emerald";
}

function countCatalogInBag(state: GameState, catalogId: string): number {
  return state.player.inventory.filter((item) => item.catalogId === catalogId)
    .length;
}

function getHealingPotionNudge(
  state: GameState,
  areaContext: OsmContextCategory
): OpenLoopNudge | null {
  const hasPotion = countCatalogInBag(state, HEALING_DRAUGHT_CATALOG_ID) > 0;
  if (hasPotion && !isClearSightActive(state)) {
    return {
      id: "drink-healing-clear-sight",
      message: `Drink Healing Potion for +${SCOUTS_EYE_REVEAL_BONUS_METERS} m Clear Sight`,
      tone: "violet",
    };
  }

  const status = getCraftRecipeStatus(state, "healing-potion");
  if (!status) return null;

  if (status.canCraft) {
    return {
      id: "craft-healing-ready",
      message: "Healing Potion ready at Base Camp",
      tone: "violet",
    };
  }

  const bloom = status.ingredients.find(
    (ingredient) => ingredient.catalogId === "marsh-bloom"
  );
  const coin = status.ingredients.find(
    (ingredient) => ingredient.catalogId === "well-coin"
  );
  const gathered = (bloom?.have ?? 0) + (coin?.have ?? 0) > 0;

  if (gathered) {
    const parts = status.ingredients
      .filter((ingredient) => ingredient.required > 0)
      .map(
        (ingredient) =>
          `${ingredient.label} ${ingredient.have}/${ingredient.required}`
      );
    return {
      id: "craft-healing-progress",
      message: `${parts.join(" · ")} → Healing Potion`,
      tone: "amber",
    };
  }

  if (areaContext === "marsh") {
    return {
      id: "craft-healing-marsh",
      message: "Gather Marsh Blooms here for a Healing Potion",
      tone: "emerald",
    };
  }

  return null;
}

export function getTopOpenLoopNudge(input: {
  codex: Codex;
  baseCamp: GameState["baseCamp"];
  pois: POI[];
  playerPosition: Position | null;
  visitedPois: GameState["visitedPois"];
  gameState?: GameState;
  areaContext?: OsmContextCategory;
}): OpenLoopNudge | null {
  const almost = getAlmostCompleteSets(input.codex);
  if (almost.length > 0) {
    const set = almost[0]!.set;
    return {
      id: `set-${set.id}`,
      message: `One find from completing ${set.name}`,
      tone: "amber",
    };
  }

  if (input.gameState) {
    const craftNudge = getHealingPotionNudge(
      input.gameState,
      input.areaContext ?? "generic"
    );
    if (craftNudge) return craftNudge;
  }

  const readyDoors = countReadyDepotDoors(input.codex, input.baseCamp);
  if (readyDoors > 0) {
    return {
      id: "depot-door",
      message: `${readyDoors} depot door${readyDoors === 1 ? "" : "s"} ready at camp`,
      tone: "violet",
    };
  }

  if (input.playerPosition) {
    const unexplored = input.pois.filter((poi) =>
      canReExplorePoi(input.visitedPois[poi.id], poi.type)
    );
    const nearest = findNearestPoi(input.playerPosition, unexplored);
    if (nearest) {
      return {
        id: `poi-${nearest.id}`,
        message: `Nearest site: ${nearest.name}`,
        tone: "emerald",
      };
    }
  }

  return null;
}
