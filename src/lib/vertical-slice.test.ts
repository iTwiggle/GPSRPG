import { describe, expect, it } from "vitest";
import { getApproachReadout } from "./approach";
import { canExplorePoi } from "./explore-validation";
import { distanceMeters } from "./distance";
import {
  GUARANTEED_FIRST_POI_MAX_METERS,
  GUARANTEED_FIRST_POI_MIN_METERS,
  generateNearbyPOIs,
} from "./poi-generator";
import { getAreaCellCenter, getAreaCellKey } from "./osm-context";
import { EXPLORE_RADIUS_METERS, type POI, type VisitedPoiState } from "./types";

function makePoi(overrides: Partial<POI> = {}): POI {
  return {
    id: "poi-test-0",
    name: "Test Shrine",
    type: "shrine",
    flavor: "A test site.",
    lat: 37.775,
    lng: -122.4194,
    ...overrides,
  };
}

function makeVisit(
  poi: POI,
  overrides: Partial<VisitedPoiState> = {}
): VisitedPoiState {
  return {
    lastExploredAt: new Date().toISOString(),
    exploreCount: 1,
    poiType: poi.type,
    ...overrides,
  };
}

describe("getApproachReadout", () => {
  it("marks targets within explore radius as in_range", () => {
    const player = { lat: 37.7749, lng: -122.4194 };
    const poi = makePoi({ lat: 37.7755, lng: -122.4194 });
    const readout = getApproachReadout(player, poi, EXPLORE_RADIUS_METERS);

    expect(readout.status).toBe("in_range");
    expect(readout.distanceMeters).toBeLessThanOrEqual(EXPLORE_RADIUS_METERS);
  });

  it("marks distant targets as far", () => {
    const player = { lat: 37.7749, lng: -122.4194 };
    const poi = makePoi({ lat: 37.78, lng: -122.4194 });
    const readout = getApproachReadout(player, poi, EXPLORE_RADIUS_METERS);

    expect(readout.status).toBe("far");
  });
});

describe("canExplorePoi", () => {
  const player = { lat: 37.7749, lng: -122.4194 };
  const inRangePoi = makePoi({ lat: 37.7755, lng: -122.4194 });
  const farPoi = makePoi({ id: "poi-far", lat: 37.78, lng: -122.4194 });
  const landmarkPoi = makePoi({ id: "poi-tower", type: "tower" });
  const dailyPoi = makePoi({ id: "poi-cache", type: "cache" });

  it("allows explore when in range and unvisited", () => {
    expect(canExplorePoi(player, inRangePoi, {}).ok).toBe(true);
  });

  it("blocks explore when out of range", () => {
    const result = canExplorePoi(player, farPoi, {});
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("out_of_range");
  });

  it("blocks repeat explore for landmarks", () => {
    const visited = { [landmarkPoi.id]: makeVisit(landmarkPoi) };
    const result = canExplorePoi(player, landmarkPoi, visited);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("already_visited");
  });

  it("blocks repeat explore while a daily POI is on cooldown", () => {
    const visited = { [dailyPoi.id]: makeVisit(dailyPoi) };
    const result = canExplorePoi(player, dailyPoi, visited);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("on_cooldown");
  });

  it("allows repeat explore after cooldown expires", () => {
    const visited = {
      [dailyPoi.id]: makeVisit(dailyPoi, {
        lastExploredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    };
    expect(canExplorePoi(player, dailyPoi, visited).ok).toBe(true);
  });

  it("allows simulate to bypass range and visited checks", () => {
    const visited = {
      [inRangePoi.id]: makeVisit(inRangePoi),
      [landmarkPoi.id]: makeVisit(landmarkPoi),
    };
    expect(canExplorePoi(player, farPoi, visited, { simulate: true }).ok).toBe(
      true
    );
    expect(
      canExplorePoi(player, landmarkPoi, visited, { simulate: true }).ok
    ).toBe(true);
  });
});

describe("generateNearbyPOIs", () => {
  const sampleAnchors = [
    { lat: 40.7128, lng: -74.006 },
    { lat: 51.5, lng: -0.12 },
    { lat: 37.7749, lng: -122.4194 },
    { lat: 35.6762, lng: 139.6503 },
  ];

  it("places the first POI between 70 m and 110 m from the anchor", () => {
    for (const anchor of sampleAnchors) {
      const pois = generateNearbyPOIs(anchor.lat, anchor.lng);
      const firstDistance = distanceMeters(anchor, pois[0]);

      expect(firstDistance).toBeGreaterThanOrEqual(
        GUARANTEED_FIRST_POI_MIN_METERS
      );
      expect(firstDistance).toBeLessThanOrEqual(GUARANTEED_FIRST_POI_MAX_METERS);
      expect(firstDistance).toBeLessThanOrEqual(EXPLORE_RADIUS_METERS);
    }
  });

  it("keeps remaining POIs on the cell-centered 120–450 m ring", () => {
    for (const anchor of sampleAnchors) {
      const pois = generateNearbyPOIs(anchor.lat, anchor.lng);
      const cellCenter = getAreaCellCenter(getAreaCellKey(anchor.lat, anchor.lng));

      for (const poi of pois.slice(1)) {
        const distance = distanceMeters(cellCenter, poi);
        expect(distance).toBeGreaterThanOrEqual(120);
        expect(distance).toBeLessThanOrEqual(450);
      }
    }
  });

  it("returns deterministic POIs for the same anchor", () => {
    const first = generateNearbyPOIs(51.5, -0.12);
    const second = generateNearbyPOIs(51.5, -0.12);

    expect(first.map((poi) => poi.id)).toEqual(second.map((poi) => poi.id));
  });
});
