import { describe, expect, it } from "vitest";
import { createInitialState } from "../storage";
import {
  CLEAR_SIGHT_DURATION_MS,
  isClearSightActive,
  tryDrinkHealingDraught,
} from "./clear-sight";

describe("clear sight potion", () => {
  it("drinks a healing draught and grants a timed Clear Sight window", () => {
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
    const now = new Date("2026-07-20T12:00:00.000Z");

    const result = tryDrinkHealingDraught(state, now);

    expect(result.ok).toBe(true);
    expect(result.state.player.inventory).toHaveLength(0);
    expect(isClearSightActive(result.state, now)).toBe(true);
    expect(isClearSightActive(result.state, new Date(now.getTime() + CLEAR_SIGHT_DURATION_MS + 1))).toBe(
      false
    );
  });

  it("rejects drink when the bag has no potion", () => {
    const state = createInitialState();
    const result = tryDrinkHealingDraught(state);
    expect(result.ok).toBe(false);
  });
});
