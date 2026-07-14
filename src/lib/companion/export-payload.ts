import type { GameState } from "@/lib/types";
import {
  buildBoards,
  buildInventoryExport,
  buildOutdoorEffortFromLedger,
  buildUnlockTokens,
} from "./unlock-tokens";
import {
  COMPANION_EXPORT_SCHEMA_VERSION,
  type CompanionExportV1,
} from "./export-schema";

export interface BuildExportPayloadOptions {
  platform?: "web" | "android";
  outdoorEffort?: CompanionExportV1["outdoorEffort"];
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
  };
}

export function serializeExportPayload(payload: CompanionExportV1): string {
  return JSON.stringify(payload, null, 2);
}
