import { getCatalogEntry } from "@/lib/item-catalog";
import type { GameState, Item } from "@/lib/types";
import {
  SANCTUM_CRAFTING_RECIPES,
  type SanctumCraftingRecipe,
} from "./sanctum-scaffold";

export interface CraftIngredientStatus {
  catalogId: string;
  label: string;
  required: number;
  have: number;
  shortfall: number;
}

export interface CraftRecipeStatus {
  recipe: SanctumCraftingRecipe;
  ingredients: CraftIngredientStatus[];
  canCraft: boolean;
}

export function getSanctumRecipe(recipeId: string): SanctumCraftingRecipe | undefined {
  return SANCTUM_CRAFTING_RECIPES.find((recipe) => recipe.recipeId === recipeId);
}

export function countInventoryByCatalogId(
  inventory: Item[],
  catalogId: string
): number {
  return inventory.filter((item) => item.catalogId === catalogId).length;
}

export function getCraftRecipeStatus(
  state: GameState,
  recipeId: string
): CraftRecipeStatus | null {
  const recipe = getSanctumRecipe(recipeId);
  if (!recipe) return null;

  const ingredients = recipe.ingredients.map((ingredient) => {
    const have = countInventoryByCatalogId(
      state.player.inventory,
      ingredient.catalogId
    );
    return {
      catalogId: ingredient.catalogId,
      label: ingredient.label,
      required: ingredient.required,
      have,
      shortfall: Math.max(0, ingredient.required - have),
    };
  });

  return {
    recipe,
    ingredients,
    canCraft: ingredients.every((ingredient) => ingredient.shortfall === 0),
  };
}

function removeInventoryMaterials(
  inventory: Item[],
  catalogId: string,
  count: number
): Item[] {
  let remaining = count;
  const next: Item[] = [];

  for (const item of inventory) {
    if (remaining > 0 && item.catalogId === catalogId) {
      remaining -= 1;
      continue;
    }
    next.push(item);
  }

  return next;
}

export function tryCraftSanctumRecipe(
  state: GameState,
  recipeId: string
): { state: GameState; ok: boolean; message?: string } {
  const status = getCraftRecipeStatus(state, recipeId);
  if (!status) {
    return { state, ok: false, message: "Unknown recipe." };
  }
  if (!status.canCraft) {
    return { state, ok: false, message: "Not enough materials in your bag." };
  }

  const output = getCatalogEntry({
    catalogId: status.recipe.outputCatalogId,
    name: status.recipe.name,
    type: "consumable",
  });
  if (!output) {
    return { state, ok: false, message: "Recipe output missing from catalog." };
  }

  let inventory = state.player.inventory;
  for (const ingredient of status.recipe.ingredients) {
    inventory = removeInventoryMaterials(
      inventory,
      ingredient.catalogId,
      ingredient.required
    );
  }

  const craftedItem: Item = {
    id: `crafted-${status.recipe.outputCatalogId}-${Date.now()}`,
    catalogId: output.catalogId,
    name: output.name,
    type: output.type,
    rarity: output.rarity,
  };

  return {
    ok: true,
    state: {
      ...state,
      player: {
        ...state.player,
        inventory: [...inventory, craftedItem],
      },
    },
    message: `Crafted ${output.name}.`,
  };
}
