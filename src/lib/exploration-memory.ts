import { distanceMeters } from "./distance";
import type { Position } from "./types";

export const EXPLORATION_MEMORY_STORAGE_KEY = "gpsrpg-exploration-memory-v1";
export const EXPLORATION_CELL_METERS = 80;
export const EXPLORATION_REVEAL_RADIUS_METERS = 120;
export const EXPLORATION_RESET_EVENT = "gpsrpg:exploration-memory-reset";

export interface ExplorationMemory {
  revealedCellKeys: string[];
}

export interface ExplorationCell {
  cellLat: number;
  cellLng: number;
}

export function createEmptyExplorationMemory(): ExplorationMemory {
  return { revealedCellKeys: [] };
}

export function getExplorationCell(position: Position): ExplorationCell {
  const latStep = EXPLORATION_CELL_METERS / 111_320;
  const cellLat = Math.floor(position.lat / latStep) * latStep;
  const lngStep =
    EXPLORATION_CELL_METERS /
    (111_320 * Math.cos((cellLat * Math.PI) / 180));
  const cellLng = Math.floor(position.lng / lngStep) * lngStep;
  return { cellLat, cellLng };
}

export function explorationCellKey(cell: ExplorationCell): string {
  return `${cell.cellLat.toFixed(6)},${cell.cellLng.toFixed(6)}`;
}

export function parseExplorationCellKey(
  key: string
): ExplorationCell | null {
  const [latRaw, lngRaw] = key.split(",");
  const cellLat = Number(latRaw);
  const cellLng = Number(lngRaw);
  if (!Number.isFinite(cellLat) || !Number.isFinite(cellLng)) return null;
  return { cellLat, cellLng };
}

export function getExplorationCellCenter(
  cell: ExplorationCell
): Position {
  const latStep = EXPLORATION_CELL_METERS / 111_320;
  const lngStep =
    EXPLORATION_CELL_METERS /
    (111_320 * Math.cos((cell.cellLat * Math.PI) / 180));
  return {
    lat: cell.cellLat + latStep / 2,
    lng: cell.cellLng + lngStep / 2,
  };
}

export function getRevealCellKeys(position: Position): string[] {
  const origin = getExplorationCell(position);
  const originCenter = getExplorationCellCenter(origin);
  const latStep = EXPLORATION_CELL_METERS / 111_320;
  const cellRadius = Math.ceil(
    EXPLORATION_REVEAL_RADIUS_METERS / EXPLORATION_CELL_METERS
  );
  const keys = new Set<string>();

  for (let row = -cellRadius; row <= cellRadius; row++) {
    const targetLat = originCenter.lat + row * latStep;
    const lngStep =
      EXPLORATION_CELL_METERS /
      (111_320 * Math.cos((targetLat * Math.PI) / 180));

    for (let col = -cellRadius; col <= cellRadius; col++) {
      const targetPosition = {
        lat: targetLat,
        lng: originCenter.lng + col * lngStep,
      };
      const cell = getExplorationCell(targetPosition);
      const center = getExplorationCellCenter(cell);
      if (
        distanceMeters(position, center) <=
        EXPLORATION_REVEAL_RADIUS_METERS
      ) {
        keys.add(explorationCellKey(cell));
      }
    }
  }

  return [...keys];
}

export function revealExplorationPosition(
  memory: ExplorationMemory,
  position: Position
): ExplorationMemory {
  const existing = new Set(memory.revealedCellKeys);
  let changed = false;

  for (const key of getRevealCellKeys(position)) {
    if (existing.has(key)) continue;
    existing.add(key);
    changed = true;
  }

  if (!changed) return memory;
  return { revealedCellKeys: [...existing] };
}

export function normalizeExplorationMemory(
  value: unknown
): ExplorationMemory {
  if (!value || typeof value !== "object") {
    return createEmptyExplorationMemory();
  }

  const rawKeys = (value as Partial<ExplorationMemory>).revealedCellKeys;
  if (!Array.isArray(rawKeys)) return createEmptyExplorationMemory();

  return {
    revealedCellKeys: [
      ...new Set(
        rawKeys.filter((key): key is string => typeof key === "string")
      ),
    ],
  };
}

export function readExplorationMemory(): ExplorationMemory {
  if (typeof window === "undefined") return createEmptyExplorationMemory();
  try {
    const raw = localStorage.getItem(EXPLORATION_MEMORY_STORAGE_KEY);
    if (!raw) return createEmptyExplorationMemory();
    return normalizeExplorationMemory(JSON.parse(raw) as unknown);
  } catch {
    return createEmptyExplorationMemory();
  }
}

export function writeExplorationMemory(memory: ExplorationMemory): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      EXPLORATION_MEMORY_STORAGE_KEY,
      JSON.stringify(memory)
    );
  } catch {
    // In-memory reveal state remains active for this tab if storage is blocked.
  }
}

export function clearExplorationMemory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(EXPLORATION_MEMORY_STORAGE_KEY);
  } catch {
    // The reset signal still clears in-memory reveal state.
  }
  if (typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new Event(EXPLORATION_RESET_EVENT));
  }
}
