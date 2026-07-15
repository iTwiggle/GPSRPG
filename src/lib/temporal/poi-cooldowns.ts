import type { POIType, VisitedPoiState } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** `null` = landmark, explored once forever. */
export const POI_COOLDOWN_MS: Record<POIType, number | null> = {
  cache: DAY_MS,
  quarry: DAY_MS,
  camp: 3 * DAY_MS,
  grove: 3 * DAY_MS,
  shrine: 7 * DAY_MS,
  well: 7 * DAY_MS,
  tower: null,
  gate: null,
};

export type PoiVisitUiStatus = "fresh" | "ready" | "cooldown" | "landmark_done";

export interface PoiCooldownOptions {
  cooldownMultiplier?: number;
}

export function getPoiCooldownMs(poiType: POIType): number | null {
  return POI_COOLDOWN_MS[poiType];
}

export function isLandmarkPoiType(poiType: POIType): boolean {
  return POI_COOLDOWN_MS[poiType] === null;
}

export function getCooldownRemainingMs(
  visit: VisitedPoiState | undefined,
  poiType: POIType,
  nowMs: number = Date.now(),
  options?: PoiCooldownOptions
): number {
  const cooldownMs = getPoiCooldownMs(poiType);
  if (!visit || cooldownMs === null) return 0;

  const multiplier = options?.cooldownMultiplier ?? 1;
  const effectiveCooldown = cooldownMs * multiplier;
  const elapsed = nowMs - Date.parse(visit.lastExploredAt);
  return Math.max(0, effectiveCooldown - elapsed);
}

export function isPoiOnCooldown(
  visit: VisitedPoiState | undefined,
  poiType: POIType,
  nowMs: number = Date.now(),
  options?: PoiCooldownOptions
): boolean {
  return getCooldownRemainingMs(visit, poiType, nowMs, options) > 0;
}

export function canReExplorePoi(
  visit: VisitedPoiState | undefined,
  poiType: POIType,
  nowMs: number = Date.now(),
  options?: PoiCooldownOptions
): boolean {
  if (!visit) return true;
  if (isLandmarkPoiType(poiType)) return false;
  return !isPoiOnCooldown(visit, poiType, nowMs, options);
}

export function getPoiVisitUiStatus(
  visit: VisitedPoiState | undefined,
  poiType: POIType,
  nowMs: number = Date.now(),
  options?: PoiCooldownOptions
): PoiVisitUiStatus {
  if (!visit) return "fresh";
  if (isLandmarkPoiType(poiType)) return "landmark_done";
  if (isPoiOnCooldown(visit, poiType, nowMs, options)) return "cooldown";
  return "ready";
}

export function formatCooldownRemaining(ms: number): string {
  if (ms <= 0) return "Ready";
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h`;
  const days = Math.ceil(ms / DAY_MS);
  return `${days}d`;
}
