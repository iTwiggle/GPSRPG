import { itemCatalogKey } from "@/lib/companion/catalog-registry";
import type { Item, Player } from "./types";

export const SALVAGE_COMMON_COUNT = 3;
export const SALVAGE_XP_REWARD = 15;

export interface SalvageResult {
  player: Player;
  xpGained: number;
  removedCount: number;
}

/** Turn three copies of the same common item into bonus XP. */
export function salvageCommonTriplet(
  player: Player,
  catalogKey: string
): SalvageResult | null {
  const matching = player.inventory.filter(
    (item) => itemCatalogKey(item) === catalogKey && item.rarity === "common"
  );

  if (matching.length < SALVAGE_COMMON_COUNT) {
    return null;
  }

  const idsToRemove = new Set(
    matching.slice(0, SALVAGE_COMMON_COUNT).map((item) => item.id)
  );

  return {
    player: {
      ...player,
      inventory: player.inventory.filter((item) => !idsToRemove.has(item.id)),
    },
    xpGained: SALVAGE_XP_REWARD,
    removedCount: SALVAGE_COMMON_COUNT,
  };
}

export function canSalvageCommon(item: Pick<Item, "name" | "type" | "rarity">, count: number): boolean {
  return item.rarity === "common" && count >= SALVAGE_COMMON_COUNT;
}
