import { createEmptyActivityLog, appendFieldReportEvents } from "./activity-log";
import { createEmptyCodex } from "./codex";
import {
  createEmptyFieldReport,
  normalizeFieldReport,
} from "./field-report";
import { generateFieldTasks, normalizeFieldTasks } from "./tasks";
import { createDefaultPlayer } from "./xp";
import type { GameState, Item, Player } from "./types";

const STORAGE_KEY = "gpsrpg-game-state-v1";
export const STORAGE_SCHEMA_VERSION = 1;

const CORRUPT_SAVE_BACKUP_PREFIX = `${STORAGE_KEY}-corrupt-`;

export interface LoadGameStateResult {
  state: GameState;
  warning: string | null;
}

export interface SaveGameStateResult {
  ok: boolean;
  warning: string | null;
}

type StoredGameState = Partial<GameState> & {
  schemaVersion?: number;
};

export function createInitialState(): GameState {
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    player: createDefaultPlayer(),
    visitedPOIIds: [],
    codex: createEmptyCodex(),
    activityLog: createEmptyActivityLog(),
    fieldTasks: generateFieldTasks(),
    fieldReport: createEmptyFieldReport(),
  };
}

function backupCorruptSave(raw: string): string | null {
  if (typeof window === "undefined") return null;

  const backupKey = `${CORRUPT_SAVE_BACKUP_PREFIX}${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`;

  try {
    localStorage.setItem(backupKey, raw);
    return backupKey;
  } catch {
    return null;
  }
}

function normalizeGameState(parsed: StoredGameState): GameState {
  const fallbackPlayer = createDefaultPlayer();
  const savedPlayer = parsed.player ?? fallbackPlayer;

  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    player: {
      ...fallbackPlayer,
      ...savedPlayer,
      inventory: savedPlayer.inventory ?? [],
    },
    visitedPOIIds: parsed.visitedPOIIds ?? [],
    codex: parsed.codex ?? createEmptyCodex(),
    activityLog: parsed.activityLog ?? createEmptyActivityLog(),
    fieldTasks: normalizeFieldTasks(parsed.fieldTasks),
    fieldReport: normalizeFieldReport(parsed.fieldReport),
  };
}

export function loadGameState(): LoadGameStateResult {
  if (typeof window === "undefined") {
    return { state: createInitialState(), warning: null };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { state: createInitialState(), warning: null };
    }

    const parsed = JSON.parse(raw) as StoredGameState;
    return {
      state: normalizeGameState(parsed),
      warning: null,
    };
  } catch (error) {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }
    const backupKey = raw ? backupCorruptSave(raw) : null;
    const detail =
      error instanceof Error ? error.message : "Unknown save-load error";

    return {
      state: createInitialState(),
      warning: backupKey
        ? `Your saved game could not be read, so a fresh save was started. A backup was kept as ${backupKey}. (${detail})`
        : `Your saved game could not be read, so a fresh save was started. The corrupt save could not be backed up. (${detail})`,
    };
  }
}

export function saveGameState(state: GameState): SaveGameStateResult {
  if (typeof window === "undefined") {
    return { ok: true, warning: null };
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        schemaVersion: STORAGE_SCHEMA_VERSION,
      })
    );
    return { ok: true, warning: null };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown save-write error";
    return {
      ok: false,
      warning: `Progress is active in this tab but could not be saved to this browser. Check storage/private browsing settings before closing. (${detail})`,
    };
  }
}

export function markPoiVisited(state: GameState, poiId: string): GameState {
  if (state.visitedPOIIds.includes(poiId)) {
    return state;
  }
  return {
    ...state,
    visitedPOIIds: [...state.visitedPOIIds, poiId],
  };
}

export function addLootToPlayer(player: Player, loot: Item[]): Player {
  return {
    ...player,
    inventory: [...player.inventory, ...loot],
  };
}

export function resetFieldReportInState(
  state: GameState,
  timestamp: string = new Date().toISOString()
): GameState {
  const previousReport = state.fieldReport;
  const nextReport = createEmptyFieldReport(timestamp);

  return {
    ...state,
    fieldReport: nextReport,
    activityLog: appendFieldReportEvents(state.activityLog, previousReport, timestamp),
  };
}

export function resetGameState(): GameState {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Reset still returns a fresh in-memory save if browser storage is blocked.
    }
  }
  return createInitialState();
}
