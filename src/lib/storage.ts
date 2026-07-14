import { appendFieldReportEvents } from "./activity-log";
import { resolveCatalogId } from "./companion/catalog-registry";
import { createEmptyBaseCamp, normalizeBaseCamp } from "./base-camp";
import { createEmptyCodex, normalizeCodex } from "./codex";
import { clearExplorationMemory } from "./exploration-memory";
import {
  createEmptyFieldReport,
  normalizeFieldReport,
} from "./field-report";
import { getStorageAdapter } from "./platform/storage-adapter";
import {
  CORRUPT_SAVE_BACKUP_PREFIX,
  RESETTABLE_STORAGE_KEYS,
  STORAGE_KEYS,
} from "./platform/storage-keys";
import { generateFieldTasks, normalizeFieldTasks } from "./tasks";
import { createDefaultPlayer } from "./xp";
import type { CompanionMeta, GameState, Item, Player } from "./types";

export const STORAGE_SCHEMA_VERSION = 2;

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

function backupCorruptSave(raw: string): string | null {
  const storage = getStorageAdapter();
  const backupKey = `${CORRUPT_SAVE_BACKUP_PREFIX}${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`;

  try {
    storage.setItem(backupKey, raw);
    return backupKey;
  } catch {
    return null;
  }
}

function normalizeCompanionMeta(
  meta: Partial<CompanionMeta> | undefined
): CompanionMeta {
  return {
    lastContractRefreshDate: meta?.lastContractRefreshDate,
  };
}

function normalizeInventoryItem(item: Item): Item {
  const catalogId = resolveCatalogId(item);
  if (!catalogId || item.catalogId === catalogId) {
    return catalogId ? { ...item, catalogId } : item;
  }
  return { ...item, catalogId };
}

function normalizeGameState(parsed: StoredGameState): GameState {
  const fallbackPlayer = createDefaultPlayer();
  const savedPlayer = parsed.player ?? fallbackPlayer;

  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    player: {
      ...fallbackPlayer,
      ...savedPlayer,
      inventory: (savedPlayer.inventory ?? []).map(normalizeInventoryItem),
    },
    visitedPOIIds: parsed.visitedPOIIds ?? [],
    codex: normalizeCodex(parsed.codex),
    activityLog: parsed.activityLog ?? [],
    fieldTasks: normalizeFieldTasks(parsed.fieldTasks),
    fieldReport: normalizeFieldReport(parsed.fieldReport),
    baseCamp: normalizeBaseCamp(parsed.baseCamp),
    companionMeta: normalizeCompanionMeta(parsed.companionMeta),
  };
}

export function createInitialState(): GameState {
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    player: createDefaultPlayer(),
    visitedPOIIds: [],
    codex: createEmptyCodex(),
    activityLog: [],
    fieldTasks: generateFieldTasks(),
    fieldReport: createEmptyFieldReport(),
    baseCamp: createEmptyBaseCamp(),
    companionMeta: {},
  };
}

export function loadGameState(): LoadGameStateResult {
  if (typeof window === "undefined") {
    return { state: createInitialState(), warning: null };
  }

  const storage = getStorageAdapter();

  try {
    const raw = storage.getItem(STORAGE_KEYS.gameState);
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
      raw = storage.getItem(STORAGE_KEYS.gameState);
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

  const storage = getStorageAdapter();

  try {
    storage.setItem(
      STORAGE_KEYS.gameState,
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
    inventory: [...player.inventory, ...loot.map(normalizeInventoryItem)],
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

/** Clears all resettable companion keys. Location consent is intentionally kept. */
export function clearAllCompanionStorage(): void {
  if (typeof window === "undefined") return;

  const storage = getStorageAdapter();
  for (const key of RESETTABLE_STORAGE_KEYS) {
    storage.removeItem(key);
  }
}

export function resetGameState(): GameState {
  if (typeof window !== "undefined") {
    clearAllCompanionStorage();
    clearExplorationMemory();
  }
  return createInitialState();
}
