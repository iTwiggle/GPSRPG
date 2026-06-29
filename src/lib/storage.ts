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

export function createInitialState(): GameState {
  return {
    player: createDefaultPlayer(),
    visitedPOIIds: [],
    codex: createEmptyCodex(),
    activityLog: createEmptyActivityLog(),
    fieldTasks: generateFieldTasks(),
    fieldReport: createEmptyFieldReport(),
  };
}

export function loadGameState(): GameState {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialState();
    }
    const parsed = JSON.parse(raw) as GameState;
    return {
      player: {
        ...createDefaultPlayer(),
        ...parsed.player,
        inventory: parsed.player?.inventory ?? [],
      },
      visitedPOIIds: parsed.visitedPOIIds ?? [],
      codex: parsed.codex ?? createEmptyCodex(),
      activityLog: parsed.activityLog ?? createEmptyActivityLog(),
      fieldTasks: normalizeFieldTasks(parsed.fieldTasks),
      fieldReport: normalizeFieldReport(parsed.fieldReport),
    };
  } catch {
    return createInitialState();
  }
}

export function saveGameState(state: GameState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
    localStorage.removeItem(STORAGE_KEY);
  }
  return createInitialState();
}
