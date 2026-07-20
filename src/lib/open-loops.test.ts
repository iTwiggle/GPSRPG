import { describe, expect, it } from "vitest";
import { createInitialState } from "./storage";
import { getTopOpenLoopNudge } from "./open-loops";

describe("open-loop bloom quest nudges", () => {
  it("nudges marsh bloom gathering when standing in a marsh with empty bag", () => {
    const state = createInitialState();
    const nudge = getTopOpenLoopNudge({
      codex: state.codex,
      baseCamp: state.baseCamp,
      pois: [],
      playerPosition: { lat: 37.77, lng: -122.42 },
      visitedPois: state.visitedPois,
      gameState: state,
      areaContext: "marsh",
    });

    expect(nudge?.id).toBe("craft-healing-marsh");
    expect(nudge?.message).toContain("Marsh Blooms");
  });

  it("tracks healing potion ingredient progress from the bag", () => {
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

    const nudge = getTopOpenLoopNudge({
      codex: state.codex,
      baseCamp: state.baseCamp,
      pois: [],
      playerPosition: null,
      visitedPois: state.visitedPois,
      gameState: state,
      areaContext: "generic",
    });

    expect(nudge?.id).toBe("craft-healing-progress");
    expect(nudge?.message).toContain("Marsh Bloom 2/3");
    expect(nudge?.message).toContain("Well Coin 1/2");
  });

  it("nudges drinking a crafted potion for Clear Sight", () => {
    const state = createInitialState();
    state.player.inventory = [
      {
        id: "potion-1",
        catalogId: "healing-draught",
        name: "Healing Draught",
        type: "consumable",
        rarity: "uncommon",
      },
    ];

    const nudge = getTopOpenLoopNudge({
      codex: state.codex,
      baseCamp: state.baseCamp,
      pois: [],
      playerPosition: null,
      visitedPois: state.visitedPois,
      gameState: state,
      areaContext: "generic",
    });

    expect(nudge?.id).toBe("drink-healing-clear-sight");
    expect(nudge?.message).toContain("+80 m");
  });

  it("surfaces ready craft when all healing potion materials are in bag", () => {
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

    const nudge = getTopOpenLoopNudge({
      codex: state.codex,
      baseCamp: state.baseCamp,
      pois: [],
      playerPosition: null,
      visitedPois: state.visitedPois,
      gameState: state,
      areaContext: "generic",
    });

    expect(nudge?.id).toBe("craft-healing-ready");
    expect(nudge?.message).toContain("Base Camp");
  });
});
