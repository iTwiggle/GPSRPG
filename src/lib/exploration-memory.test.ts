import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearExplorationMemory,
  createEmptyExplorationMemory,
  EXPLORATION_MEMORY_STORAGE_KEY,
  getRevealCellKeys,
  readExplorationMemory,
  revealExplorationPosition,
  writeExplorationMemory,
} from "./exploration-memory";
import type { Position } from "./types";

function moveNorth(position: Position, meters: number): Position {
  return {
    lat: position.lat + meters / 111_320,
    lng: position.lng,
  };
}

describe("exploration memory", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
    });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    });
  });

  it("reveals movement cells and returns the same object when nothing new is added", () => {
    const origin = { lat: 37.7749, lng: -122.4194 };
    const empty = createEmptyExplorationMemory();
    const revealed = revealExplorationPosition(empty, origin);
    const unchanged = revealExplorationPosition(revealed, origin);

    expect(revealed.revealedCellKeys.length).toBeGreaterThan(0);
    expect(unchanged).toBe(revealed);
  });

  it("accumulates a persistent corridor and does not forget on backtracking", () => {
    const origin = { lat: 37.7749, lng: -122.4194 };
    let memory = createEmptyExplorationMemory();

    for (let walked = 0; walked <= 800; walked += 40) {
      memory = revealExplorationPosition(memory, moveNorth(origin, walked));
    }

    const outwardCount = memory.revealedCellKeys.length;
    memory = revealExplorationPosition(memory, origin);

    expect(outwardCount).toBeGreaterThan(getRevealCellKeys(origin).length);
    expect(memory.revealedCellKeys).toHaveLength(outwardCount);
  });

  it("persists revealed cells across reload", () => {
    const origin = { lat: 37.7749, lng: -122.4194 };
    const memory = revealExplorationPosition(
      createEmptyExplorationMemory(),
      origin
    );

    writeExplorationMemory(memory);
    const loaded = readExplorationMemory();

    expect(loaded).toEqual(memory);
    expect(localStorage.getItem(EXPLORATION_MEMORY_STORAGE_KEY)).not.toBeNull();
  });

  it("clears persisted exploration memory", () => {
    writeExplorationMemory({ revealedCellKeys: ["37.000000,-122.000000"] });
    clearExplorationMemory();

    expect(readExplorationMemory().revealedCellKeys).toEqual([]);
    expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
  });
});
