import type { Item, ItemRarity } from "./types";

export const RARITY_ORDER: Record<ItemRarity, number> = {
  rare: 0,
  uncommon: 1,
  common: 2,
};

export const RARITY_TEXT: Record<ItemRarity, string> = {
  common: "text-slate-300",
  uncommon: "text-emerald-300",
  rare: "text-amber-300",
};

export const RARITY_CHIP: Record<ItemRarity, string> = {
  common: "border-slate-500/40 bg-slate-700/50 text-slate-200",
  uncommon: "border-emerald-500/40 bg-emerald-900/40 text-emerald-200",
  rare: "border-amber-500/50 bg-amber-900/40 text-amber-200",
};

export const RARITY_LABEL: Record<ItemRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
};

export const ITEM_TYPE_LABEL: Record<Item["type"], string> = {
  weapon: "Weapon",
  armor: "Armor",
  consumable: "Consumable",
  treasure: "Treasure",
};

/** Compact glyph used in album/inventory icon slots. */
export const ITEM_TYPE_GLYPH: Record<Item["type"], string> = {
  weapon: "⚔",
  armor: "🛡",
  consumable: "✦",
  treasure: "◆",
};

export const RARITY_GLOW_CLASS: Record<ItemRarity, string> = {
  common: "",
  uncommon: "rpg-item-icon--uncommon",
  rare: "rpg-item-icon--rare",
};

export function itemCatalogKey(item: Pick<Item, "name" | "type">): string {
  return `${item.name}|${item.type}`;
}

export interface AggregatedInventoryItem {
  key: string;
  name: string;
  type: Item["type"];
  rarity: ItemRarity;
  count: number;
}

export function aggregateInventory(inventory: Item[]): AggregatedInventoryItem[] {
  const grouped = new Map<string, AggregatedInventoryItem>();

  for (const item of inventory) {
    const key = itemCatalogKey(item);
    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    grouped.set(key, {
      key,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      count: 1,
    });
  }

  return [...grouped.values()].sort((a, b) => {
    const rarityDiff = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
    if (rarityDiff !== 0) return rarityDiff;
    return a.name.localeCompare(b.name);
  });
}

export function lootRevealClass(rarity: ItemRarity): string {
  if (rarity === "rare") return "rpg-loot-reveal--rare";
  if (rarity === "uncommon") return "rpg-loot-reveal--uncommon";
  return "";
}
