import { describe, expect, it } from "vitest";
import { CATALOG_IDS } from "./catalog-registry";
import { buildExportPayload } from "./export-payload";
import { COMPANION_EXPORT_SCHEMA_VERSION } from "./export-schema";
import { createInitialState } from "../storage";

describe("companion export payload", () => {
  it("builds a versioned export with stable catalog ids", () => {
    const state = createInitialState();
    state.player.inventory.push({
      id: "item-rusty-dagger-test",
      catalogId: CATALOG_IDS.rustyDagger,
      name: "Rusty Dagger",
      type: "weapon",
      rarity: "common",
    });
    state.player.level = 3;
    state.player.xp = 250;
    state.codex.completedSetIds = ["travelers-kit"];

    const payload = buildExportPayload(state);

    expect(payload.schemaVersion).toBe(COMPANION_EXPORT_SCHEMA_VERSION);
    expect(payload.platform).toBe("web");
    expect(payload.player.level).toBe(3);
    expect(payload.inventory).toHaveLength(1);
    expect(payload.inventory[0]?.catalogId).toBe(CATALOG_IDS.rustyDagger);
    expect(payload.unlockTokens.some((token) => token.token === "level_reached:3")).toBe(
      true
    );
    expect(
      payload.unlockTokens.some(
        (token) => token.token === "set_complete:travelers-kit"
      )
    ).toBe(true);
    expect(payload.boards.setProgress.length).toBeGreaterThan(0);
  });
});
