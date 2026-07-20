import { SCOUTS_EYE_REVEAL_BONUS_METERS } from "@/lib/movement/trail-momentum";
import type { GameState, Item } from "@/lib/types";

export const CLEAR_SIGHT_DURATION_MS = 45 * 60 * 1000;
export const HEALING_DRAUGHT_CATALOG_ID = "healing-draught";

export function isClearSightActive(
  state: GameState,
  now: Date = new Date()
): boolean {
  const expiresAt = state.companionMeta?.clearSightExpiresAt;
  if (!expiresAt) return false;
  const expiresMs = Date.parse(expiresAt);
  return Number.isFinite(expiresMs) && expiresMs > now.getTime();
}

export function getClearSightRemainingMs(
  state: GameState,
  now: Date = new Date()
): number {
  const expiresAt = state.companionMeta?.clearSightExpiresAt;
  if (!expiresAt) return 0;
  const expiresMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresMs)) return 0;
  return Math.max(0, expiresMs - now.getTime());
}

function removeOneCatalogItem(inventory: Item[], catalogId: string): Item[] | null {
  const index = inventory.findIndex((item) => item.catalogId === catalogId);
  if (index < 0) return null;
  return [...inventory.slice(0, index), ...inventory.slice(index + 1)];
}

/**
 * Drink a Healing Potion from the bag to grant Clear Sight —
 * the same +80 m live reveal footprint as Scout's Eye — for 45 minutes.
 */
export function tryDrinkHealingDraught(
  state: GameState,
  now: Date = new Date()
): { state: GameState; ok: boolean; message?: string } {
  const nextInventory = removeOneCatalogItem(
    state.player.inventory,
    HEALING_DRAUGHT_CATALOG_ID
  );
  if (!nextInventory) {
    return {
      state,
      ok: false,
      message: "No Healing Potion in your bag.",
    };
  }

  const expiresAt = new Date(now.getTime() + CLEAR_SIGHT_DURATION_MS).toISOString();

  return {
    ok: true,
    message: `Clear Sight: +${SCOUTS_EYE_REVEAL_BONUS_METERS} m live sight for 45 min`,
    state: {
      ...state,
      player: {
        ...state.player,
        inventory: nextInventory,
      },
      companionMeta: {
        ...state.companionMeta,
        clearSightExpiresAt: expiresAt,
      },
    },
  };
}
