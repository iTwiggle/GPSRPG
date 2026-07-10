import { describe, expect, it } from "vitest";
import { getApproachReadout } from "./approach";
import { canExplorePoi } from "./explore-validation";
import { distanceMeters } from "./distance";
import { generateNearbyPOIs } from "./poi-generator";
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
  it("places the first POI within explore radius of the anchor", () => {
    const anchor = { lat: 40.7128, lng: -74.006 };
    const pois = generateNearbyPOIs(anchor.lat, anchor.lng);

    expect(pois.length).toBeGreaterThan(0);
    const firstDistance = distanceMeters(anchor, pois[0]);
    expect(firstDistance).toBeLessThanOrEqual(EXPLORE_RADIUS_METERS);
  });

  it("returns deterministic POIs for the same anchor", () => {
    const first = generateNearbyPOIs(51.5, -0.12);
    const second = generateNearbyPOIs(51.5, -0.12);

    expect(first.map((poi) => poi.id)).toEqual(second.map((poi) => poi.id));
  });
});
