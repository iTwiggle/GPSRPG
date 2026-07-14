import type { GameState } from "@/lib/types";
import { buildSanctumScaffold } from "./sanctum-scaffold";
import {
  buildBoards,
  buildInventoryExport,
  buildOutdoorEffortFromLedger,
  buildUnlockTokens,
} from "./unlock-tokens";
import {
  COMPANION_EXPORT_SCHEMA_VERSION,
  type CompanionExportV1,
  type CompanionSanctumScaffold,
} from "./export-schema";

export interface BuildExportPayloadOptions {
  platform?: "web" | "android";
  outdoorEffort?: CompanionExportV1["outdoorEffort"];
  sanctumGearFromUe5?: Parameters<typeof buildSanctumScaffold>[1];
}

function buildSanctumExport(
  state: GameState,
  gearFromUe5?: BuildExportPayloadOptions["sanctumGearFromUe5"]
): CompanionSanctumScaffold {
  const scaffold = buildSanctumScaffold(state, gearFromUe5);
  return {
    gearSlots: scaffold.gearSlots.map((slot) => ({
      slotId: slot.slotId,
      catalogId: slot.catalogId,
      source: slot.source,
    })),
    craftingNudges: scaffold.craftingNudges.map((nudge) => ({
      recipeId: nudge.recipeId,
      outputCatalogId: nudge.outputCatalogId,
      readyInSanctum: nudge.readyInSanctum,
      missing: nudge.missing.map((gap) => ({
        catalogId: gap.catalogId,
        shortfall: gap.shortfall,
      })),
    })),
  };
}

export function buildExportPayload(
  state: GameState,
  options: BuildExportPayloadOptions = {}
): CompanionExportV1 {
  return {
    schemaVersion: COMPANION_EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    platform: options.platform ?? "web",
    player: {
      name: state.player.name,
      level: state.player.level,
      xp: state.player.xp,
    },
    inventory: buildInventoryExport(state),
    boards: buildBoards(state),
    outdoorEffort:
      options.outdoorEffort ??
      buildOutdoorEffortFromLedger(state.movementLedger),
    unlockTokens: buildUnlockTokens(state),
    sanctum: buildSanctumExport(state, options.sanctumGearFromUe5),
  };
}

export function serializeExportPayload(payload: CompanionExportV1): string {
  return JSON.stringify(payload, null, 2);
}
