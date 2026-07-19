import { describe, expect, it } from "vitest";
import { createInitialState } from "../storage";
import {
  getCraftRecipeStatus,
  tryCraftSanctumRecipe,
} from "./sanctum-craft";

describe("sanctum craft", () => {
  it("tracks inventory-based ingredient gaps for healing potion", () => {
    const state = createInitialState();
    state.player.inventory = [
      {
        id: "bloom-1",
        catalogId: "marsh-bloom",
        name: "Marsh Bloom",
        type: "consumable",
        rarity: "common",
      },
      {
        id: "bloom-2",
        catalogId: "marsh-bloom",
        name: "Marsh Bloom",
        type: "consumable",
        rarity: "common",
      },
      {
        id: "coin-1",
        catalogId: "well-coin",
        name: "Well Coin",
        type: "treasure",
        rarity: "common",
      },
    ];

    const status = getCraftRecipeStatus(state, "healing-potion");

    expect(status?.canCraft).toBe(false);
    expect(status?.ingredients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          catalogId: "marsh-bloom",
          have: 2,
          required: 3,
          shortfall: 1,
        }),
        expect.objectContaining({
          catalogId: "well-coin",
          have: 1,
          required: 2,
          shortfall: 1,
        }),
      ])
    );
  });

  it("crafts healing potion when bag holds enough materials", () => {
    const state = createInitialState();
    state.player.inventory = [
      ...Array.from({ length: 3 }, (_, index) => ({
        id: `bloom-${index}`,
        catalogId: "marsh-bloom",
        name: "Marsh Bloom",
        type: "consumable" as const,
        rarity: "common" as const,
      })),
      ...Array.from({ length: 2 }, (_, index) => ({
        id: `coin-${index}`,
        catalogId: "well-coin",
        name: "Well Coin",
        type: "treasure" as const,
        rarity: "common" as const,
      })),
    ];

    const result = tryCraftSanctumRecipe(state, "healing-potion");

    expect(result.ok).toBe(true);
    expect(result.state.player.inventory).toHaveLength(1);
    expect(result.state.player.inventory[0]?.catalogId).toBe("healing-draught");
  });
});
