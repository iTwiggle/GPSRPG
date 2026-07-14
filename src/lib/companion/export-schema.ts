import type { GameState, ItemRarity } from "@/lib/types";

export const COMPANION_EXPORT_SCHEMA_VERSION = 1;

export interface CompanionExportInventoryEntry {
  catalogId: string;
  rarity: ItemRarity;
  acquiredAt: string;
}

export interface CompanionExportSetProgress {
  setId: string;
  discovered: number;
  total: number;
  complete: boolean;
}

export interface CompanionExportBoards {
  completedSetIds: string[];
  setProgress: CompanionExportSetProgress[];
  codexStats: GameState["codex"]["stats"];
}

export interface CompanionOutdoorEffort {
  totalLeaguesCharted: number;
  todayLeaguesCharted: number;
  totalMinutesInMotion: number;
  outingsCompleted: number;
  lastOutdoorSessionAt: string | null;
}

export interface CompanionUnlockToken {
  token: string;
  at: string;
}

export interface CompanionExportV1 {
  schemaVersion: typeof COMPANION_EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  platform: "web" | "android";
  player: {
    name: string;
    level: number;
    xp: number;
  };
  inventory: CompanionExportInventoryEntry[];
  boards: CompanionExportBoards;
  outdoorEffort: CompanionOutdoorEffort;
  unlockTokens: CompanionUnlockToken[];
}
