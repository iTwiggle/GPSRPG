import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createInitialState,
  markPoiVisited,
  saveGameState,
  loadGameState,
  STORAGE_SCHEMA_VERSION,
} from "./storage";
import { STORAGE_KEYS } from "./platform/storage-keys";
import { CATALOG_IDS } from "./companion/catalog-registry";

const STORAGE_KEY = STORAGE_KEYS.gameState;

describe("storage vertical slice", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    const store = new Map<string, string>();
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

  it("persists visited POI ids and inventory across reload", () => {
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
    expect(loaded.state.visitedPOIIds).toContain("poi-1-2-3-0");
    expect(loaded.state.player.inventory).toHaveLength(1);
    expect(loaded.state.schemaVersion).toBe(STORAGE_SCHEMA_VERSION);
    expect(loaded.state.player.inventory[0]?.catalogId).toBe(
      CATALOG_IDS.rustyDagger
    );
    expect(localStorage.getItem(STORAGE_KEY)).toContain("poi-1-2-3-0");
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

    expect(loaded.state.schemaVersion).toBe(2);
    expect(loaded.state.codex.items[CATALOG_IDS.rustyDagger]?.countFound).toBe(1);
  });
});
