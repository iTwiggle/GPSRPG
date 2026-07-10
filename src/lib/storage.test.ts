import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createInitialState,
  markPoiVisited,
  saveGameState,
  loadGameState,
  STORAGE_SCHEMA_VERSION,
} from "./storage";

const STORAGE_KEY = "gpsrpg-game-state-v1";

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
});
