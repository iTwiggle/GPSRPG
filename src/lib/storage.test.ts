import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAllCompanionStorage,
  createInitialState,
  markPoiVisited,
  saveGameState,
  loadGameState,
  STORAGE_SCHEMA_VERSION,
} from "./storage";
import { STORAGE_KEYS } from "./platform/storage-keys";
import { resetStorageAdapter, setStorageAdapter } from "./platform/storage-adapter";
import { CATALOG_IDS } from "./companion/catalog-registry";

const STORAGE_KEY = STORAGE_KEYS.gameState;

function createTestLocalStorage() {
  const store = new Map<string, string>();
  return {
    store,
    api: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  };
}

describe("storage vertical slice", () => {
  let testStorage: ReturnType<typeof createTestLocalStorage>;

  beforeEach(() => {
    vi.stubGlobal("window", {});
    testStorage = createTestLocalStorage();
    vi.stubGlobal("localStorage", testStorage.api);
  });

  it("persists visited POI state and inventory across reload", () => {
    const initial = createInitialState();
    const explored = markPoiVisited(
      {
        ...initial,
        player: {
          ...initial.player,
          inventory: [
            {
              id: "item-1",
              catalogId: CATALOG_IDS.rustyDagger,
              name: "Rusty Dagger",
              type: "weapon",
              rarity: "common",
            },
          ],
        },
      },
      "poi-1-2-3-0"
    );

    saveGameState(explored);
    const loaded = loadGameState();

    expect(loaded.warning).toBeNull();
    expect(loaded.state.visitedPois["poi-1-2-3-0"]?.exploreCount).toBe(1);
    expect(loaded.state.movementLedger.totalMeters).toBe(0);
    expect(loaded.state.player.inventory).toHaveLength(1);
    expect(loaded.state.schemaVersion).toBe(STORAGE_SCHEMA_VERSION);
    expect(loaded.state.player.inventory[0]?.catalogId).toBe(
      CATALOG_IDS.rustyDagger
    );
    expect(localStorage.getItem(STORAGE_KEY)).toContain("poi-1-2-3-0");
  });

  it("does not persist the exact runtime GPS sample", () => {
    const state = createInitialState();
    state.movementLedger = {
      ...state.movementLedger,
      totalMeters: 125,
      lastPosition: { lat: 41.4993, lng: -81.6944 },
      lastSampleAt: "2026-07-15T12:00:00.000Z",
      lastOutdoorSessionAt: "2026-07-15T12:00:00.000Z",
    };

    saveGameState(state);

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(raw).not.toContain("41.4993");
    expect(raw).not.toContain("-81.6944");
    expect(raw).not.toContain("lastPosition");
    expect(raw).not.toContain("lastSampleAt");
    expect(raw).toContain("\"totalMeters\":125");
  });

  it("drops precise samples from legacy saves on load", () => {
    const state = createInitialState();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        movementLedger: {
          ...state.movementLedger,
          lastPosition: { lat: 41.4993, lng: -81.6944 },
          lastSampleAt: "2026-07-15T12:00:00.000Z",
        },
      })
    );

    const loaded = loadGameState();

    expect(loaded.state.movementLedger.lastPosition).toBeUndefined();
    expect(loaded.state.movementLedger.lastSampleAt).toBeUndefined();
  });

  it("normalizes legacy saves without schemaVersion", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        player: createInitialState().player,
        visitedPOIIds: ["poi-legacy"],
      })
    );

    const loaded = loadGameState();

    expect(loaded.warning).toBeNull();
    expect(loaded.state.schemaVersion).toBe(STORAGE_SCHEMA_VERSION);
    expect(loaded.state.visitedPois["poi-legacy"]?.exploreCount).toBe(1);
    expect(loaded.state.visitedPois["poi-legacy"]?.poiType).toBe("camp");
  });

  it("recovers from corrupt JSON and backs up the raw save", () => {
    localStorage.setItem(STORAGE_KEY, "{bad json");

    const loaded = loadGameState();

    expect(loaded.warning).toContain("fresh save was started");
    expect(loaded.state.schemaVersion).toBe(STORAGE_SCHEMA_VERSION);
    const backupKey = [...testStorage.store.keys()].find((key) =>
      key.startsWith(`${STORAGE_KEY}-corrupt-`)
    );
    expect(backupKey).toBeDefined();
    expect(testStorage.api.getItem(backupKey!)).toBe("{bad json");
  });

  it("surfaces a warning when save writes fail", () => {
    setStorageAdapter({
      getItem: () => null,
      setItem: () => {
        throw new Error("test quota");
      },
      removeItem: () => {},
    });

    try {
      const result = saveGameState(createInitialState());

      expect(result.ok).toBe(false);
      expect(result.warning).toContain("could not be saved");
      expect(result.warning).toContain("test quota");
    } finally {
      resetStorageAdapter();
    }
  });

  it("clears location-derived caches on reset but keeps consent", () => {
    localStorage.setItem(STORAGE_KEYS.gameState, "game");
    localStorage.setItem(STORAGE_KEYS.explorationMemory, "fog");
    localStorage.setItem(STORAGE_KEYS.onboardingPoi, "poi");
    localStorage.setItem(STORAGE_KEYS.osmContext, "osm-cell-cache");
    localStorage.setItem(STORAGE_KEYS.locationConsent, "live");

    clearAllCompanionStorage();

    expect(localStorage.getItem(STORAGE_KEYS.gameState)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.explorationMemory)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.onboardingPoi)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.osmContext)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.locationConsent)).toBe("live");
  });

  it("migrates legacy v1 codex keys to catalog ids", () => {
    const legacy = {
      schemaVersion: 1,
      player: createInitialState().player,
      visitedPOIIds: [],
      codex: {
        items: {
          "Rusty Dagger|weapon": {
            name: "Rusty Dagger",
            type: "weapon",
            rarity: "common",
            countFound: 1,
            firstFoundAt: "2026-01-01T00:00:00.000Z",
            lastFoundAt: "2026-01-01T00:00:00.000Z",
          },
        },
        pois: {},
        encounters: {},
        stats: createInitialState().codex.stats,
        completedSetIds: [],
      },
      activityLog: [],
      fieldTasks: createInitialState().fieldTasks,
      fieldReport: createInitialState().fieldReport,
      baseCamp: createInitialState().baseCamp,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
    const loaded = loadGameState();

    expect(loaded.state.schemaVersion).toBe(STORAGE_SCHEMA_VERSION);
    expect(loaded.state.codex.items[CATALOG_IDS.rustyDagger]?.countFound).toBe(1);
  });
});
