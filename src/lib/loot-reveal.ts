import type { Codex, Item, ItemRarity } from "./types";

const RARITY_RANK: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
};

const REVEAL_BASE_DELAY_MS: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 140,
  rare: 480,
};

const REVEAL_STAGGER_MS = 90;

export function itemCodexKey(item: Pick<Item, "name" | "type">): string {
  return `${item.name}|${item.type}`;
}

/** Highest rarity in a loot drop batch (for modal framing). */
export function getPeakLootRarity(loot: Item[]): ItemRarity | null {
  if (loot.length === 0) return null;

  return loot.reduce<ItemRarity>((peak, item) => {
    return RARITY_RANK[item.rarity] > RARITY_RANK[peak] ? item.rarity : peak;
  }, loot[0].rarity);
}

/** Staggered reveal delay per item row (slot-machine beat without RNG). */
export function getLootRevealDelayMs(
  rarity: ItemRarity,
  index: number
): number {
  return REVEAL_BASE_DELAY_MS[rarity] + index * REVEAL_STAGGER_MS;
}

/** True when codex was just updated and this is the first find of this item. */
export function isFirstCodexFind(codex: Codex, item: Item): boolean {
  const entry = codex.items[itemCodexKey(item)];
  return entry?.countFound === 1;
}

export function lootRevealClass(rarity: ItemRarity): string {
  return `loot-reveal loot-reveal--${rarity}`;
}

export function encounterModalPeakClass(
  peak: ItemRarity | null
): string {
  if (!peak || peak === "common") return "";
  return `encounter-modal--peak-${peak}`;
}
