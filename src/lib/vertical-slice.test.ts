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
import { EXPLORE_RADIUS_METERS, type POI } from "./types";

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

  it("allows explore when in range and unvisited", () => {
    expect(canExplorePoi(player, inRangePoi, []).ok).toBe(true);
  });

  it("blocks explore when out of range", () => {
    const result = canExplorePoi(player, farPoi, []);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("out_of_range");
  });

  it("blocks repeat explore for visited POIs", () => {
    const result = canExplorePoi(player, inRangePoi, [inRangePoi.id]);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("already_visited");
  });

  it("allows simulate to bypass range and visited checks", () => {
    expect(
      canExplorePoi(player, farPoi, [], { simulate: true }).ok
    ).toBe(true);
    expect(
      canExplorePoi(player, inRangePoi, [inRangePoi.id], { simulate: true }).ok
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

  it("orbits place-anchored fields around the landmark centroid", () => {
    const place = { lat: 37.7694, lng: -122.4862 };
    const pois = generateNearbyPOIs(place.lat, place.lng, {
      areaContext: "park_or_woods",
      placeAnchored: true,
    });

    expect(pois[0].id.endsWith("-p")).toBe(true);
    const firstDistance = distanceMeters(place, pois[0]);
    expect(firstDistance).toBeGreaterThanOrEqual(GUARANTEED_FIRST_POI_MIN_METERS);
    expect(firstDistance).toBeLessThanOrEqual(GUARANTEED_FIRST_POI_MAX_METERS);

    for (const poi of pois.slice(1)) {
      const distance = distanceMeters(place, poi);
      expect(distance).toBeGreaterThanOrEqual(120);
      expect(distance).toBeLessThanOrEqual(450);
    }
  });

  it("returns deterministic POIs for the same anchor", () => {
    const first = generateNearbyPOIs(51.5, -0.12);
    const second = generateNearbyPOIs(51.5, -0.12);

    expect(first.map((poi) => poi.id)).toEqual(second.map((poi) => poi.id));
  });
});
