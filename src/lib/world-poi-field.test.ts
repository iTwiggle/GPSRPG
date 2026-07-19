import { describe, expect, it } from "vitest";
import type { POI, Position } from "./types";
import {
  buildWorldPoiField,
  generateWorldCellPois,
  getWorldFieldCells,
  resolveCellAreaContext,
} from "./world-poi-field";
import { cellKeyToString, getAreaCellKey } from "./osm-context";

function moveNorth(position: Position, meters: number): Position {
  return {
    lat: position.lat + meters / 111_320,
    lng: position.lng,
  };
}

function ids(pois: POI[]): Set<string> {
  return new Set(pois.map((poi) => poi.id));
}

function overlapCount(a: Set<string>, b: Set<string>): number {
  return [...a].filter((id) => b.has(id)).length;
}

describe("rolling deterministic POI world field", () => {
  const origin = { lat: 37.7749, lng: -122.4194 };

  it("owns stable POI identity and placement by world cell", () => {
    const cell = getAreaCellKey(origin.lat, origin.lng);
    const generic = generateWorldCellPois(cell, "generic");
    const grove = generateWorldCellPois(cell, "park_or_woods");

    expect(generic.map(({ id, lat, lng }) => ({ id, lat, lng }))).toEqual(
      grove.map(({ id, lat, lng }) => ({ id, lat, lng }))
    );
    expect(generic.map((poi) => poi.name)).not.toEqual(
      grove.map((poi) => poi.name)
    );
  });

  it("returns the same world field for the same position", () => {
    const first = buildWorldPoiField(origin, "generic");
    const second = buildWorldPoiField(origin, "generic");

    expect(second).toEqual(first);
    expect(first.length).toBeGreaterThan(0);
  });

  it("keeps most visible POIs stable across each 40 m movement step", () => {
    let previous = buildWorldPoiField(origin, "generic");

    for (let walked = 40; walked <= 1_000; walked += 40) {
      const next = buildWorldPoiField(
        moveNorth(origin, walked),
        "generic"
      );
      const previousIds = ids(previous);
      const nextIds = ids(next);
      const overlap = overlapCount(previousIds, nextIds);
      const overlapRatio = overlap / Math.max(1, previousIds.size);
      const changed =
        previousIds.size + nextIds.size - overlap * 2;

      expect(overlapRatio).toBeGreaterThanOrEqual(0.75);
      expect(changed).toBeLessThanOrEqual(4);
      previous = next;
    }
  });

  it("does not wholesale reroll around the retired 280 m anchor threshold", () => {
    const before = buildWorldPoiField(moveNorth(origin, 240), "generic");
    const threshold = buildWorldPoiField(moveNorth(origin, 280), "generic");
    const after = buildWorldPoiField(moveNorth(origin, 320), "generic");

    const beforeIds = ids(before);
    const thresholdIds = ids(threshold);
    const afterIds = ids(after);

    expect(overlapCount(beforeIds, thresholdIds)).toBeGreaterThanOrEqual(
      Math.floor(beforeIds.size * 0.75)
    );
    expect(overlapCount(thresholdIds, afterIds)).toBeGreaterThanOrEqual(
      Math.floor(thresholdIds.size * 0.75)
    );
  });

  it("enumerates enough surrounding cells for distance-based edge streaming", () => {
    const cells = getWorldFieldCells(origin);
    expect(cells.length).toBeGreaterThanOrEqual(20);
  });

  it("uses live area context for the player's current cell", () => {
    const cell = getAreaCellKey(origin.lat, origin.lng);
    const currentCellKey = cellKeyToString(cell);

    expect(resolveCellAreaContext(cell, currentCellKey, "marsh")).toBe("marsh");
    expect(resolveCellAreaContext(cell, currentCellKey, "generic")).toBe(
      "generic"
    );
  });
});
