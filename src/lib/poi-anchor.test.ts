import { beforeEach, describe, expect, it, vi } from "vitest";
import { offsetPosition } from "./distance";
import {
  POI_ANCHOR_REGENERATE_METERS,
  POI_ANCHOR_STALE_RELOCATION_METERS,
  contextUpgradeNeedsRefresh,
  createPoiAnchor,
  getAnchorRefreshOrigin,
  shouldRegeneratePoiAnchor,
  shouldReplaceStaleAnchorOnStartup,
  writePoiAnchor,
} from "./poi-anchor";
import {
  createInitialState,
  loadGameState,
  markPoiVisited,
  saveGameState,
} from "./storage";

describe("stale anchor relocation", () => {
  const storedAnchor = {
    lat: 37.7749,
    lng: -122.4194,
    areaContext: "generic" as const,
  };

  it("uses a 200 m startup threshold derived from the POI grid", () => {
    expect(POI_ANCHOR_STALE_RELOCATION_METERS).toBe(200);
    expect(POI_ANCHOR_REGENERATE_METERS).toBe(280);
    expect(POI_ANCHOR_STALE_RELOCATION_METERS).toBeLessThan(
      POI_ANCHOR_REGENERATE_METERS
    );
  });

  it("retains the persisted anchor on a nearby restart", () => {
    const nearby = offsetPosition(storedAnchor, 60, 20);
    expect(shouldReplaceStaleAnchorOnStartup(nearby, storedAnchor)).toBe(
      false
    );
    expect(shouldRegeneratePoiAnchor(nearby, storedAnchor)).toBe(false);
  });

  it("does not treat ordinary GPS drift as a relocation", () => {
    const drifted = offsetPosition(storedAnchor, 35, -25);
    expect(shouldReplaceStaleAnchorOnStartup(drifted, storedAnchor)).toBe(
      false
    );
    expect(shouldRegeneratePoiAnchor(drifted, storedAnchor)).toBe(false);
  });

  it("replaces a stale anchor when reopening far away", () => {
    const farAway = offsetPosition(storedAnchor, 0, 1500);
    expect(shouldReplaceStaleAnchorOnStartup(farAway, storedAnchor)).toBe(
      true
    );
    expect(
      createPoiAnchor(farAway, "generic").lat
    ).toBeCloseTo(farAway.lat, 5);
  });

  it("still requires a longer walk before refreshing the field during play", () => {
    const walked = offsetPosition(storedAnchor, 0, 240);
    expect(shouldReplaceStaleAnchorOnStartup(walked, storedAnchor)).toBe(true);
    expect(shouldRegeneratePoiAnchor(walked, storedAnchor)).toBe(false);
  });

  it("anchors place fields to the landmark but refreshes from the player latch", () => {
    const player = { lat: 37.7749, lng: -122.4194 };
    const place = {
      name: "Golden Gate Park",
      category: "park_or_woods" as const,
      lat: 37.7694,
      lng: -122.4862,
    };
    const anchor = createPoiAnchor(player, "park_or_woods", place);

    expect(anchor.placeAnchored).toBe(true);
    expect(anchor.placeName).toBe("Golden Gate Park");
    expect(anchor.lat).toBeCloseTo(place.lat, 5);
    expect(getAnchorRefreshOrigin(anchor)).toEqual({
      lat: player.lat,
      lng: player.lng,
    });
    expect(shouldRegeneratePoiAnchor(player, anchor)).toBe(false);
  });
});

describe("contextUpgradeNeedsRefresh", () => {
  const genericAnchor = createPoiAnchor(
    { lat: 37.7749, lng: -122.4194 },
    "generic"
  );

  it("refreshes when mood upgrades from generic", () => {
    expect(
      contextUpgradeNeedsRefresh(genericAnchor, "park_or_woods", null)
    ).toBe(true);
  });

  it("refreshes when a named place appears for the current mood", () => {
    const moodAnchor = createPoiAnchor(
      { lat: 37.7749, lng: -122.4194 },
      "park_or_woods"
    );
    expect(
      contextUpgradeNeedsRefresh(moodAnchor, "park_or_woods", {
        name: "Alamo Square",
        category: "park_or_woods",
        lat: 37.7763,
        lng: -122.4328,
      })
    ).toBe(true);
  });

  it("does not downgrade a rich field when Overpass fails to generic", () => {
    const placeAnchor = createPoiAnchor(
      { lat: 37.7749, lng: -122.4194 },
      "park_or_woods",
      {
        name: "Alamo Square",
        category: "park_or_woods",
        lat: 37.7763,
        lng: -122.4328,
      }
    );
    expect(contextUpgradeNeedsRefresh(placeAnchor, "generic", null)).toBe(
      false
    );
  });
});

describe("anchor changes do not erase progress", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
  });

  it("keeps inventory and codex when only the POI anchor changes", () => {
    const initial = markPoiVisited(
      {
        ...createInitialState(),
        player: {
          ...createInitialState().player,
          inventory: [
            {
              id: "item-1",
              name: "Rusty Dagger",
              type: "weapon",
              rarity: "common",
            },
          ],
        },
        codex: {
          ...createInitialState().codex,
          stats: {
            ...createInitialState().codex.stats,
            totalExplores: 1,
            totalItemsFound: 1,
          },
        },
      },
      "poi-old-cell-0"
    );

    saveGameState(initial);

    writePoiAnchor({
      lat: 40.7128,
      lng: -74.006,
      areaContext: "generic",
    });

    const loaded = loadGameState();
    expect(loaded.state.player.inventory).toHaveLength(1);
    expect(loaded.state.visitedPOIIds).toContain("poi-old-cell-0");
    expect(loaded.state.codex.stats.totalExplores).toBe(1);
  });
});
