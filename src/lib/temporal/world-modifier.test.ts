import { describe, expect, it } from "vitest";
import {
  applyWorldModifierToEncounter,
  getCooldownMultiplierForPoi,
  getWorldModifierForDate,
  WORLD_MODIFIERS,
} from "./world-modifier";

describe("world modifier", () => {
  it("picks a deterministic modifier for a calendar date", () => {
    const first = getWorldModifierForDate("2026-07-14");
    const second = getWorldModifierForDate("2026-07-14");
    const other = getWorldModifierForDate("2026-07-15");

    expect(second.id).toBe(first.id);
    expect(WORLD_MODIFIERS.some((modifier) => modifier.id === first.id)).toBe(
      true
    );
    expect(other.id).not.toBe(first.id);
  });

  it("applies trail bounty XP to encounters", () => {
    const modifier = WORLD_MODIFIERS.find((entry) => entry.id === "trail-bounty")!;
    const result = applyWorldModifierToEncounter(
      {
        title: "Test",
        description: "Test",
        xpGained: 10,
        loot: [],
      },
      { id: "poi-1", name: "Camp", type: "camp", flavor: "", lat: 0, lng: 0 },
      modifier,
      "seed"
    );

    expect(result.encounter.xpGained).toBe(18);
    expect(result.modifierMessage).toContain("Trail Bounty");
  });

  it("discounts cooldown for matching poi types", () => {
    const modifier = WORLD_MODIFIERS.find((entry) => entry.id === "quick-cache")!;
    expect(getCooldownMultiplierForPoi(modifier, "cache")).toBe(0.5);
    expect(getCooldownMultiplierForPoi(modifier, "shrine")).toBe(1);
  });
});
