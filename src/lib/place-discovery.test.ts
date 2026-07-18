import { describe, expect, it } from "vitest";
import {
  applyFirstVisitPlaceBonus,
  getFootfallRelic,
  isPlaceDiscovered,
  markPlaceDiscovered,
} from "./place-discovery";
import type { NamedOsmPlace } from "./osm-context";
import type { EncounterResult, POI } from "./types";

const place: NamedOsmPlace = {
  id: "way/myrtle",
  name: "Myrtle Grove Park",
  category: "park_or_woods",
  lat: 37.78,
  lng: -122.42,
};

const grovePoi: POI = {
  id: "poi-test-grove",
  name: "Misty Grove",
  type: "grove",
  flavor: "Leaves whisper.",
  lat: 37.7801,
  lng: -122.4201,
};

function baseEncounter(): EncounterResult {
  return {
    title: "Quiet Exploration",
    description: "Wind and birdsong.",
    xpGained: 5,
    loot: [],
  };
}

describe("first visit place payoff", () => {
  it("tracks discovered place ids one-shot", () => {
    expect(isPlaceDiscovered(place.id, [])).toBe(false);
    const next = markPlaceDiscovered([], place.id);
    expect(isPlaceDiscovered(place.id, next)).toBe(true);
    expect(markPlaceDiscovered(next, place.id)).toEqual(next);
  });

  it("grants affinity loot and a place-type footfall relic once", () => {
    const boosted = applyFirstVisitPlaceBonus(
      baseEncounter(),
      grovePoi,
      place
    );

    expect(boosted.firstVisitPlaceName).toBe("Myrtle Grove Park");
    expect(boosted.firstVisitRelicName).toBe(
      getFootfallRelic("park_or_woods").name
    );
    expect(boosted.description).toContain("First footfall at Myrtle Grove Park");
    expect(boosted.loot.some((item) => item.name === "Firstbloom Token")).toBe(
      true
    );
    expect(
      boosted.loot.some(
        (item) =>
          item.name === "Herb Bundle" ||
          item.name === "Beast Fang" ||
          item.name === "Firstbloom Token"
      )
    ).toBe(true);

    // Relic is place-type unique — not a random site name spoil.
    expect(boosted.loot.map((item) => item.name)).not.toContain("Misty Grove");
  });

  it("still adds the footfall relic when affinity loot already dropped", () => {
    const withAffinity: EncounterResult = {
      ...baseEncounter(),
      loot: [
        {
          id: "item-herb",
          name: "Herb Bundle",
          type: "consumable",
          rarity: "common",
        },
      ],
    };
    const boosted = applyFirstVisitPlaceBonus(withAffinity, grovePoi, place);
    expect(boosted.loot.filter((item) => item.name === "Herb Bundle")).toHaveLength(
      1
    );
    expect(boosted.loot.some((item) => item.name === "Firstbloom Token")).toBe(
      true
    );
  });
});
