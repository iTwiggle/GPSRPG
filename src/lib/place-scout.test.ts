import { describe, expect, it } from "vitest";
import {
  buildScoutReadout,
  pickScoutTarget,
  SCOUT_RADIUS_METERS,
} from "./place-scout";
import type { NamedOsmPlace } from "./osm-context";

const grove: NamedOsmPlace = {
  id: "way/grove-1",
  name: "Myrtle Grove Park",
  category: "park_or_woods",
  lat: 37.78,
  lng: -122.42,
};

const chapel: NamedOsmPlace = {
  id: "way/chapel-1",
  name: "Old Chapel",
  category: "worship",
  lat: 37.79,
  lng: -122.41,
};

describe("buildScoutReadout", () => {
  it("teases sealed sites and affinity without naming loot", () => {
    const player = { lat: 37.7749, lng: -122.4194 };
    const readout = buildScoutReadout(grove, player);

    expect(readout.headline).toMatch(/^Scanner: Grove · \d+ sealed sites · /);
    expect(readout.affinityHint).toBe("grove affinity stirs");
    expect(readout.headline.toLowerCase()).not.toContain("herb bundle");
    expect(readout.headline.toLowerCase()).not.toContain("moonlit");
    expect(readout.sealedSites).toBeGreaterThan(0);
  });
});

describe("pickScoutTarget", () => {
  const player = { lat: 37.7749, lng: -122.4194 };

  it("picks the unvisited place nearest the map focus", () => {
    const focus = { lat: grove.lat, lng: grove.lng };
    const target = pickScoutTarget({
      player,
      focus,
      candidates: [grove, chapel],
      discoveredPlaceIds: [],
    });
    expect(target?.id).toBe(grove.id);
  });

  it("skips discovered and active field places", () => {
    const focus = { lat: grove.lat, lng: grove.lng };
    expect(
      pickScoutTarget({
        player,
        focus,
        candidates: [grove, chapel],
        discoveredPlaceIds: [grove.id],
        activePlaceId: null,
      })?.id
    ).not.toBe(grove.id);

    expect(
      pickScoutTarget({
        player,
        focus,
        candidates: [grove],
        discoveredPlaceIds: [],
        activePlaceId: grove.id,
      })
    ).toBeNull();
  });

  it("ignores places beyond scout radius", () => {
    const far: NamedOsmPlace = {
      ...grove,
      id: "way/far",
      lat: player.lat + 0.05,
      lng: player.lng,
    };
    expect(
      pickScoutTarget({
        player,
        focus: far,
        candidates: [far],
        discoveredPlaceIds: [],
        radiusMeters: SCOUT_RADIUS_METERS,
      })
    ).toBeNull();
  });
});
