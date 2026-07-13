import { describe, expect, it } from "vitest";
import { getRevealCellKeys } from "./exploration-memory";
import { getDiscoverablePois } from "./poi-discovery";
import type { POI, Position } from "./types";

const ORIGIN: Position = { lat: 37.7749, lng: -122.4194 };

function moveNorth(position: Position, meters: number): Position {
  return {
    lat: position.lat + meters / 111_320,
    lng: position.lng,
  };
}

function makePoi(id: string, position: Position): POI {
  return {
    id,
    name: id,
    type: "shrine",
    flavor: `${id} flavor`,
    ...position,
  };
}

describe("fog-gated POI discovery", () => {
  const nearbyPoi = makePoi("nearby", moveNorth(ORIGIN, 110));
  const distantPosition = moveNorth(ORIGIN, 400);
  const distantPoi = makePoi("distant", distantPosition);

  it("uses the live reveal radius before its cells are persisted", () => {
    const visible = getDiscoverablePois({
      pois: [nearbyPoi, distantPoi],
      playerPosition: ORIGIN,
      revealedCellKeys: [],
      fogOfWarEnabled: true,
    });

    expect(visible.map((poi) => poi.id)).toEqual(["nearby"]);
  });

  it("keeps POIs in remembered territory discoverable", () => {
    const visible = getDiscoverablePois({
      pois: [nearbyPoi, distantPoi],
      playerPosition: ORIGIN,
      revealedCellKeys: getRevealCellKeys(distantPosition),
      fogOfWarEnabled: true,
    });

    expect(visible.map((poi) => poi.id)).toEqual(["nearby", "distant"]);
  });

  it("returns the full field when fog discovery is disabled", () => {
    const pois = [nearbyPoi, distantPoi];
    const visible = getDiscoverablePois({
      pois,
      playerPosition: ORIGIN,
      revealedCellKeys: [],
      fogOfWarEnabled: false,
    });

    expect(visible).toBe(pois);
  });
});
