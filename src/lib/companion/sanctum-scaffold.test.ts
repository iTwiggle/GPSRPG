import { describe, expect, it } from "vitest";
import { createInitialState } from "../storage";
import {
  buildCraftingProximityNudges,
  buildSanctumGearScaffold,
  buildSanctumScaffold,
  SANCTUM_CRAFTING_RECIPES,
} from "./sanctum-scaffold";

describe("sanctum scaffold", () => {
  it("returns empty gear slots until UE5 sync fills them", () => {
    const slots = buildSanctumGearScaffold();
    expect(slots).toHaveLength(4);
    expect(slots.every((slot) => slot.source === "empty")).toBe(true);
  });

  it("accepts UE5 gear catalog ids per slot", () => {
    const slots = buildSanctumGearScaffold({
      weapon: "rusty-dagger",
      armor: "travelers-cloak",
    });

    expect(slots.find((slot) => slot.slotId === "weapon")?.itemName).toBe(
      "Rusty Dagger"
    );
    expect(slots.find((slot) => slot.slotId === "weapon")?.source).toBe("ue5");
    expect(slots.find((slot) => slot.slotId === "focus")?.source).toBe("empty");
  });

  it("nudges when a sanctum recipe is close to craftable", () => {
    const state = createInitialState();
    state.codex.items["herb-bundle"] = {
      name: "Herb Bundle",
      type: "consumable",
      rarity: "common",
      countFound: 2,
      firstFoundAt: "2026-01-01T00:00:00.000Z",
      lastFoundAt: "2026-01-01T00:00:00.000Z",
    };
    state.codex.items["well-coin"] = {
      name: "Well Coin",
      type: "treasure",
      rarity: "common",
      countFound: 2,
      firstFoundAt: "2026-01-01T00:00:00.000Z",
      lastFoundAt: "2026-01-01T00:00:00.000Z",
    };

    const nudges = buildCraftingProximityNudges(state.codex);
    const healing = nudges.find((nudge) => nudge.recipeId === "healing-potion");

    expect(healing).toBeDefined();
    expect(healing?.readyInSanctum).toBe(false);
    expect(healing?.missing).toEqual([
      expect.objectContaining({
        label: "Herb Bundle",
        shortfall: 1,
      }),
    ]);
  });

  it("marks a recipe ready when all ingredients are catalogued", () => {
    const state = createInitialState();
    const healing = SANCTUM_CRAFTING_RECIPES.find(
      (recipe) => recipe.recipeId === "healing-potion"
    )!;

    for (const ingredient of healing.ingredients) {
      state.codex.items[ingredient.catalogId] = {
        name: ingredient.label,
        type: "consumable",
        rarity: "common",
        countFound: ingredient.required,
        firstFoundAt: "2026-01-01T00:00:00.000Z",
        lastFoundAt: "2026-01-01T00:00:00.000Z",
      };
    }

    const scaffold = buildSanctumScaffold(state);
    const ready = scaffold.craftingNudges.find(
      (nudge) => nudge.recipeId === "healing-potion"
    );

    expect(ready?.readyInSanctum).toBe(true);
  });
});
