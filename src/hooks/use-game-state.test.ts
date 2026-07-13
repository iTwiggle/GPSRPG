import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useGameState } from "./useGameState";
import type { POI } from "@/lib/types";

const poi: POI = {
  id: "one-shot-choice-cache",
  name: "Hidden Test Cache",
  type: "cache",
  flavor: "Fresh scratches hide something under loose stone.",
  lat: 41.4993,
  lng: -81.6944,
};

let container: HTMLDivElement;
let root: Root;
let latest: ReturnType<typeof useGameState> | null;

function Harness() {
  latest = useGameState();
  return null;
}

function getLatest(): ReturnType<typeof useGameState> {
  if (!latest) throw new Error("Game state hook has not rendered");
  return latest;
}

beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  latest = null;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(createElement(Harness)));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  localStorage.clear();
});

describe("useGameState encounter choice transaction", () => {
  it("does not spend a site until selection and consumes that selection once", async () => {
    const initial = getLatest();
    const initialXp = initial.gameState?.player.xp ?? 0;

    await act(async () => {
      initial.explorePoi(poi, { lat: poi.lat, lng: poi.lng });
    });

    const choosing = getLatest();
    expect(choosing.pendingEncounter?.poi.id).toBe(poi.id);
    expect(choosing.gameState?.visitedPOIIds).not.toContain(poi.id);
    expect(choosing.gameState?.player.xp).toBe(initialXp);

    let firstResult: ReturnType<typeof choosing.resolveEncounter>;
    let duplicateResult: ReturnType<typeof choosing.resolveEncounter>;

    await act(async () => {
      firstResult = choosing.resolveEncounter("survey");
      duplicateResult = choosing.resolveEncounter("survey");
    });

    const resolved = getLatest();
    expect(firstResult!).not.toBeNull();
    expect(duplicateResult!).toBeNull();
    expect(resolved.pendingEncounter).toBeNull();
    expect(resolved.gameState?.player.xp).toBeGreaterThan(initialXp);
    expect(
      resolved.gameState?.visitedPOIIds.filter((id) => id === poi.id)
    ).toHaveLength(1);
    expect(
      resolved.gameState?.activityLog.filter(
        (event) => event.type === "encounter"
      )
    ).toHaveLength(1);
  });

  it("cancels without visiting, rewarding, or consuming the site", async () => {
    const initial = getLatest();
    const initialXp = initial.gameState?.player.xp ?? 0;

    await act(async () => {
      initial.explorePoi(poi, { lat: poi.lat, lng: poi.lng });
    });
    await act(async () => getLatest().cancelPendingEncounter());

    const cancelled = getLatest();
    expect(cancelled.pendingEncounter).toBeNull();
    expect(cancelled.gameState?.visitedPOIIds).not.toContain(poi.id);
    expect(cancelled.gameState?.player.xp).toBe(initialXp);
    expect(cancelled.gameState?.activityLog).toHaveLength(0);
  });
});
