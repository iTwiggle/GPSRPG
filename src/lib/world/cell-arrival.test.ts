import { describe, expect, it } from "vitest";
import { createInitialState } from "../storage";
import {
  buildCellArrivalBrief,
  hasSeenFootfall,
  markFootfallSeen,
} from "./cell-arrival";

describe("cell arrival", () => {
  it("persists first-footfall cell keys", () => {
    const state = createInitialState();
    expect(hasSeenFootfall(state, "37.774000,-122.419000")).toBe(false);

    const next = markFootfallSeen(state, "37.774000,-122.419000");

    expect(hasSeenFootfall(next, "37.774000,-122.419000")).toBe(true);
    expect(next.companionMeta?.footfallCellKeys).toEqual([
      "37.774000,-122.419000",
    ]);
  });

  it("builds marsh-specific arrival copy and craft nudge", () => {
    const state = createInitialState();
    state.player.inventory = [
      {
        id: "bloom-1",
        catalogId: "marsh-bloom",
        name: "Marsh Bloom",
        type: "consumable",
        rarity: "common",
      },
    ];

    const brief = buildCellArrivalBrief({
      state,
      cellKey: "37.774000,-122.419000",
      placeCategory: "marsh",
      playerPosition: { lat: 37.7749, lng: -122.4194 },
      pois: [
        {
          id: "poi-grove",
          name: "Reed Grove",
          type: "grove",
          flavor: "Bog herbs",
          lat: 37.7751,
          lng: -122.4192,
        },
      ],
    });

    expect(brief.placeLabel).toBe("Marsh");
    expect(brief.headline).toContain("marsh");
    expect(brief.forageHint).toContain("Reed Grove");
    expect(brief.craftNudge).toContain("Marsh Bloom");
  });
});
