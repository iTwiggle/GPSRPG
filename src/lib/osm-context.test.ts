import { describe, expect, it } from "vitest";
import {
  analyzeOsmElements,
  classifyOsmElements,
  pickNamedPlaceForCategory,
} from "./osm-context";

describe("analyzeOsmElements", () => {
  it("classifies parks and picks the closest named place", () => {
    const near = { lat: 37.776, lng: -122.433 };
    const elements: Array<{
      type: string;
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags: Record<string, string>;
    }> = [
      {
        type: "way",
        id: 1,
        center: { lat: 37.7763, lon: -122.4328 },
        tags: { leisure: "park", name: "Alamo Square" },
      },
      {
        type: "way",
        id: 2,
        center: { lat: 37.78, lon: -122.45 },
        tags: { leisure: "park", name: "Distant Park" },
      },
      {
        type: "node",
        id: 3,
        lat: 37.775,
        lon: -122.434,
        tags: { shop: "convenience" },
      },
    ];

    expect(classifyOsmElements(elements)).toBe("park_or_woods");
    const { category, place } = analyzeOsmElements(elements, near);
    expect(category).toBe("park_or_woods");
    expect(place?.name).toBe("Alamo Square");
    expect(place?.lat).toBeCloseTo(37.7763, 4);
  });

  it("returns generic with no place when nothing matches", () => {
    const result = analyzeOsmElements([], { lat: 0, lng: 0 });
    expect(result.category).toBe("generic");
    expect(result.place).toBeNull();
  });

  it("skips unnamed features when picking a place", () => {
    const place = pickNamedPlaceForCategory(
      [
        {
          type: "way",
          id: 1,
          center: { lat: 37.7, lon: -122.4 },
          tags: { landuse: "cemetery" },
        },
        {
          type: "way",
          id: 2,
          center: { lat: 37.701, lon: -122.401 },
          tags: { landuse: "cemetery", name: "Cypress Lawn" },
        },
      ],
      "cemetery",
      { lat: 37.7, lng: -122.4 }
    );
    expect(place?.name).toBe("Cypress Lawn");
  });
});

describe("poi reveal helpers", () => {
  it("veils unexplored site names", async () => {
    const { getPoiDisplayName, isPoiRevealed } = await import("./poi-reveal");
    const poi = {
      id: "poi-1",
      name: "Moonlit Shrine",
      type: "shrine" as const,
      flavor: "Secret text",
      lat: 1,
      lng: 2,
    };
    expect(isPoiRevealed(poi.id, [])).toBe(false);
    expect(getPoiDisplayName(poi, false, "park_or_woods")).toBe("Veiled Grove");
    expect(getPoiDisplayName(poi, true, "park_or_woods")).toBe("Moonlit Shrine");
  });
});
