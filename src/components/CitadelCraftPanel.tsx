"use client";

import {
  getCraftRecipeStatus,
  type CraftRecipeStatus,
} from "@/lib/companion/sanctum-craft";
import { SANCTUM_CRAFTING_RECIPES } from "@/lib/companion/sanctum-scaffold";
import type { GameState } from "@/lib/types";

interface CitadelCraftPanelProps {
  gameState: GameState;
  onCraft: (recipeId: string) => boolean;
}

function formatIngredientGap(status: CraftRecipeStatus): string {
  const missing = status.ingredients.filter(
    (ingredient) => ingredient.shortfall > 0
  );
  if (missing.length === 0) return "Ready to craft";
  return missing
    .map((gap) => `${gap.have}/${gap.required} ${gap.label}`)
    .join(" · ");
}

export default function CitadelCraftPanel({
  gameState,
  onCraft,
}: CitadelCraftPanelProps) {
  const recipes = SANCTUM_CRAFTING_RECIPES.map((recipe) =>
    getCraftRecipeStatus(gameState, recipe.recipeId)
  ).filter((status): status is CraftRecipeStatus => status !== null);

  return (
    <section className="mt-4">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        Citadel crafting
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Craft at base camp using materials from your bag — the same recipes
        await you in the UE5 sanctum.
      </p>
      <ul className="mt-2 space-y-2">
        {recipes.map((status) => (
          <li
            key={status.recipe.recipeId}
            className={`rounded-lg border px-3 py-2.5 text-sm ${
              status.canCraft
                ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-50"
                : "border-slate-700/50 bg-slate-950/40 text-slate-300"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{status.recipe.name}</p>
                <p className="mt-0.5 text-xs opacity-80">
                  {formatIngredientGap(status)}
                </p>
              </div>
              {status.canCraft ? (
                <button
                  type="button"
                  onClick={() => onCraft(status.recipe.recipeId)}
                  className="shrink-0 rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-100 hover:bg-emerald-500/30"
                >
                  Craft
                </button>
              ) : (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide opacity-60">
                  Need more
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
