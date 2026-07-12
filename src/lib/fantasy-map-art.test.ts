import { describe, expect, it } from "vitest";
import {
  FANTASY_ATLAS_CHUNK_METERS,
  getFantasyAtlasPlacements,
} from "./fantasy-map-art";

const BOUNDS = {
  south: 37.768,
  west: -122.426,
  north: 37.782,
  east: -122.412,
};

describe("fantasy map art placement", () => {
  it("returns stable authored motif placements for the same world bounds", () => {
    expect(getFantasyAtlasPlacements(BOUNDS)).toEqual(
      getFantasyAtlasPlacements(BOUNDS)
    );
  });

  it("uses recognizable terrain motifs rather than visible cell shapes", () => {
    const placements = getFantasyAtlasPlacements(BOUNDS);
    const motifs = new Set(placements.map((placement) => placement.motif));
    const biomes = new Set(placements.map((placement) => placement.biome));

    expect(placements.length).toBeGreaterThan(20);
    expect(motifs.size).toBeGreaterThanOrEqual(5);
    expect(biomes.size).toBeGreaterThanOrEqual(3);
    expect(FANTASY_ATLAS_CHUNK_METERS).toBeGreaterThan(100);
  });

  it("keeps overlapping world bounds anchored to the same motif identities", () => {
    const first = getFantasyAtlasPlacements(BOUNDS);
    const shifted = getFantasyAtlasPlacements({
      south: BOUNDS.south + 0.001,
      west: BOUNDS.west + 0.001,
      north: BOUNDS.north + 0.001,
      east: BOUNDS.east + 0.001,
    });

    const shiftedIds = new Set(shifted.map((placement) => placement.id));
    const shared = first.filter((placement) => shiftedIds.has(placement.id));

    expect(shared.length).toBeGreaterThan(0);
    for (const placement of shared) {
      expect(shifted.find((candidate) => candidate.id === placement.id)).toEqual(
        placement
      );
    }
  });
});
