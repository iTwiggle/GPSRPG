import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createInitialState,
  markPoiVisited,
  saveGameState,
  loadGameState,
  STORAGE_SCHEMA_VERSION,
} from "./storage";

const STORAGE_KEY = "gpsrpg-game-state-v1";

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
    expect(localStorage.getItem(STORAGE_KEY)).toContain("poi-1-2-3-0");
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
    expect(loaded.state.visitedPOIIds).toEqual(["poi-legacy"]);
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
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("test quota");
      },
      removeItem: () => {},
    });

    const result = saveGameState(createInitialState());

    expect(result.ok).toBe(false);
    expect(result.warning).toContain("could not be saved");
    expect(result.warning).toContain("test quota");
  });
});
