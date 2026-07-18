import { getCatalogEntry } from "@/lib/item-catalog";
import type { Codex, GameState } from "@/lib/types";

/** UE5 sanctum gear slots — fill from Unreal import or future sync. */
export const SANCTUM_GEAR_SLOT_IDS = [
  "weapon",
  "armor",
  "focus",
  "charm",
] as const;

export type SanctumGearSlotId = (typeof SANCTUM_GEAR_SLOT_IDS)[number];

export type SanctumGearSource = "empty" | "ue5" | "companion-inferred";

export interface SanctumGearSlot {
  slotId: SanctumGearSlotId;
  label: string;
  catalogId: string | null;
  itemName: string | null;
  source: SanctumGearSource;
}

export interface SanctumCraftingIngredient {
  catalogId: string;
  label: string;
  required: number;
}

/**
 * Crafting recipes crafted in the UE5 sanctum using field catalog materials.
 * Extend this table as Unreal recipes are defined — catalogIds stay shared.
 */
export interface SanctumCraftingRecipe {
  recipeId: string;
  name: string;
  outputCatalogId: string;
  ingredients: SanctumCraftingIngredient[];
}

export interface CraftingIngredientGap {
  catalogId: string;
  label: string;
  have: number;
  required: number;
  shortfall: number;
}

export interface CraftingProximityNudge {
  recipeId: string;
  recipeName: string;
  outputCatalogId: string;
  outputName: string;
  readyInSanctum: boolean;
  missing: CraftingIngredientGap[];
}

export interface SanctumScaffold {
  gearSlots: SanctumGearSlot[];
  craftingNudges: CraftingProximityNudge[];
}

const SLOT_LABELS: Record<SanctumGearSlotId, string> = {
  weapon: "Weapon",
  armor: "Armor",
  focus: "Focus",
  charm: "Charm",
};

/** Starter recipe table — UE5 sanctum inserts matching rows in its data assets. */
export const SANCTUM_CRAFTING_RECIPES: SanctumCraftingRecipe[] = [
  {
    recipeId: "healing-potion",
    name: "Healing Potion",
    outputCatalogId: "healing-draught",
    ingredients: [
      { catalogId: "marsh-bloom", label: "Marsh Bloom", required: 3 },
      { catalogId: "well-coin", label: "Well Coin", required: 2 },
    ],
  },
  {
    recipeId: "patrol-kit",
    name: "Patrol Kit",
    outputCatalogId: "chain-vest",
    ingredients: [
      { catalogId: "patrol-badge", label: "Patrol Badge", required: 2 },
      { catalogId: "stone-chisel", label: "Stone Chisel", required: 5 },
    ],
  },
  {
    recipeId: "scout-bundle",
    name: "Scout Bundle",
    outputCatalogId: "enchanted-shortbow",
    ingredients: [
      { catalogId: "beast-fang", label: "Beast Fang", required: 2 },
      { catalogId: "travelers-cloak", label: "Traveler's Cloak", required: 1 },
    ],
  },
];

const PROXIMITY_MAX_SHORTFALL = 5;

function countCatalogMaterial(codex: Codex, catalogId: string): number {
  return codex.items[catalogId]?.countFound ?? 0;
}

function ingredientLabel(catalogId: string, fallback: string): string {
  return (
    getCatalogEntry({ catalogId, name: fallback, type: "consumable" })?.name ??
    fallback
  );
}

function resolveCatalogName(catalogId: string): string | null {
  return (
    getCatalogEntry({ catalogId, name: "", type: "consumable" })?.name ?? null
  );
}

export function buildSanctumGearScaffold(
  gearFromUe5?: Partial<Record<SanctumGearSlotId, string | null>>
): SanctumGearSlot[] {
  return SANCTUM_GEAR_SLOT_IDS.map((slotId) => {
    const catalogId = gearFromUe5?.[slotId] ?? null;
    const entry = catalogId ? resolveCatalogName(catalogId) : null;

    return {
      slotId,
      label: SLOT_LABELS[slotId],
      catalogId,
      itemName: entry,
      source: catalogId ? "ue5" : "empty",
    };
  });
}

export function buildCraftingProximityNudges(
  codex: Codex,
  recipes: SanctumCraftingRecipe[] = SANCTUM_CRAFTING_RECIPES,
  maxShortfall: number = PROXIMITY_MAX_SHORTFALL
): CraftingProximityNudge[] {
  const nudges: CraftingProximityNudge[] = [];

  for (const recipe of recipes) {
    const gaps: CraftingIngredientGap[] = recipe.ingredients.map((ingredient) => {
      const have = countCatalogMaterial(codex, ingredient.catalogId);
      const shortfall = Math.max(0, ingredient.required - have);
      return {
        catalogId: ingredient.catalogId,
        label: ingredientLabel(ingredient.catalogId, ingredient.label),
        have,
        required: ingredient.required,
        shortfall,
      };
    });

    const totalShortfall = gaps.reduce((sum, gap) => sum + gap.shortfall, 0);
    if (totalShortfall === 0) {
      nudges.push({
        recipeId: recipe.recipeId,
        recipeName: recipe.name,
        outputCatalogId: recipe.outputCatalogId,
        outputName:
          resolveCatalogName(recipe.outputCatalogId) ?? recipe.name,
        readyInSanctum: true,
        missing: gaps,
      });
      continue;
    }

    if (totalShortfall > maxShortfall) continue;

    nudges.push({
      recipeId: recipe.recipeId,
      recipeName: recipe.name,
      outputCatalogId: recipe.outputCatalogId,
      outputName: resolveCatalogName(recipe.outputCatalogId) ?? recipe.name,
      readyInSanctum: false,
      missing: gaps.filter((gap) => gap.shortfall > 0),
    });
  }

  return nudges.sort((a, b) => {
    if (a.readyInSanctum !== b.readyInSanctum) {
      return a.readyInSanctum ? -1 : 1;
    }
    const shortfallA = a.missing.reduce((sum, gap) => sum + gap.shortfall, 0);
    const shortfallB = b.missing.reduce((sum, gap) => sum + gap.shortfall, 0);
    return shortfallA - shortfallB;
  });
}

export function buildSanctumScaffold(
  state: GameState,
  gearFromUe5?: Partial<Record<SanctumGearSlotId, string | null>>
): SanctumScaffold {
  return {
    gearSlots: buildSanctumGearScaffold(gearFromUe5),
    craftingNudges: buildCraftingProximityNudges(state.codex),
  };
}
