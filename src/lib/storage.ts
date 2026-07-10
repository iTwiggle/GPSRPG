import { createEmptyActivityLog, appendFieldReportEvents } from "./activity-log";
import { createEmptyBaseCamp, normalizeBaseCamp } from "./base-camp";
import { createEmptyCodex, normalizeCodex } from "./codex";
import {
  createEmptyFieldReport,
  normalizeFieldReport,
} from "./field-report";
import { getSetProgressList } from "./item-catalog";
import { generateFieldTasks, normalizeFieldTasks } from "./tasks";
import { createDefaultPlayer, levelFromXp } from "./xp";
import type { ActivityEvent, Codex, GameState, Item, Player } from "./types";

const STORAGE_KEY = "gpsrpg-game-state-v1";
export const STORAGE_SCHEMA_VERSION = 1;

const CORRUPT_SAVE_BACKUP_PREFIX = `${STORAGE_KEY}-corrupt-`;
const VISITED_POI_CAP = 500;
const ACTIVITY_LOG_CAP = 50;

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

function isValidItem(value: unknown): value is Item {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Item>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    (item.type === "weapon" ||
      item.type === "armor" ||
      item.type === "consumable" ||
      item.type === "treasure") &&
    (item.rarity === "common" ||
      item.rarity === "uncommon" ||
      item.rarity === "rare")
  );
}

function normalizePlayer(raw: Partial<Player> | undefined): Player {
  const fallback = createDefaultPlayer();
  const inventory = Array.isArray(raw?.inventory)
    ? raw!.inventory.filter(isValidItem)
    : [];
  const xp =
    typeof raw?.xp === "number" && Number.isFinite(raw.xp) && raw.xp >= 0
      ? Math.floor(raw.xp)
      : 0;

  return {
    name:
      typeof raw?.name === "string" && raw.name.trim()
        ? raw.name.trim()
        : fallback.name,
    xp,
    level: levelFromXp(xp),
    inventory,
  };
}

function normalizeVisitedPoiIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const ids = raw.filter((id): id is string => typeof id === "string" && id.length > 0);
  return [...new Set(ids)].slice(-VISITED_POI_CAP);
}

function normalizeActivityLog(raw: unknown): ActivityEvent[] {
  if (!Array.isArray(raw)) return createEmptyActivityLog();
  return raw
    .filter((event): event is ActivityEvent => {
      if (!event || typeof event !== "object") return false;
      const e = event as Partial<ActivityEvent>;
      return (
        typeof e.id === "string" &&
        typeof e.timestamp === "string" &&
        typeof e.type === "string" &&
        typeof e.message === "string"
      );
    })
    .slice(0, ACTIVITY_LOG_CAP);
}

/**
 * Mark already-complete album sets as claimed without granting XP.
 * Prevents a one-time XP burst when loading saves from before completedSetIds.
 */
export function backfillCompletedSetIds(codex: Codex): Codex {
  const claimed = new Set(codex.completedSetIds);
  for (const progress of getSetProgressList(codex)) {
    if (progress.complete) {
      claimed.add(progress.set.id);
    }
  }
  if (claimed.size === codex.completedSetIds.length) {
    return codex;
  }
  return {
    ...codex,
    completedSetIds: [...claimed],
  };
}

export function createInitialState(): GameState {
  const codex = createEmptyCodex();
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    player: createDefaultPlayer(),
    visitedPOIIds: [],
    codex,
    activityLog: createEmptyActivityLog(),
    fieldTasks: generateFieldTasks(Date.now(), codex),
    fieldReport: createEmptyFieldReport(),
    baseCamp: createEmptyBaseCamp(),
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
  const codex = backfillCompletedSetIds(normalizeCodex(parsed.codex));

  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    player: normalizePlayer(parsed.player),
    visitedPOIIds: normalizeVisitedPoiIds(parsed.visitedPOIIds),
    codex,
    activityLog: normalizeActivityLog(parsed.activityLog),
    fieldTasks: normalizeFieldTasks(parsed.fieldTasks, codex),
    fieldReport: normalizeFieldReport(parsed.fieldReport),
    baseCamp: normalizeBaseCamp(parsed.baseCamp),
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
  const visitedPOIIds = [...state.visitedPOIIds, poiId];
  if (visitedPOIIds.length > VISITED_POI_CAP) {
    visitedPOIIds.splice(0, visitedPOIIds.length - VISITED_POI_CAP);
  }
  return {
    ...state,
    visitedPOIIds,
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
