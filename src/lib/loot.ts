import type { Item, ItemRarity } from "./types";

const LOOT_TABLE: Array<{
  name: string;
  type: Item["type"];
  rarity: ItemRarity;
  weight: number;
}> = [
  { name: "Rusty Dagger", type: "weapon", rarity: "common", weight: 20 },
  { name: "Traveler's Cloak", type: "armor", rarity: "common", weight: 18 },
  { name: "Healing Draught", type: "consumable", rarity: "common", weight: 22 },
  { name: "Silver Coin Pouch", type: "treasure", rarity: "common", weight: 15 },
  { name: "Enchanted Shortbow", type: "weapon", rarity: "uncommon", weight: 10 },
  { name: "Chain Vest", type: "armor", rarity: "uncommon", weight: 8 },
  { name: "Phoenix Feather", type: "consumable", rarity: "rare", weight: 4 },
  { name: "Dragon Scale", type: "treasure", rarity: "rare", weight: 3 },
];

function pickWeighted<T extends { weight: number }>(
  table: T[],
  rand: () => number
): T {
  const total = table.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rand() * total;
  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry;
    }
  }
  return table[table.length - 1];
}

function createItem(
  template: (typeof LOOT_TABLE)[number],
  suffix: string
): Item {
  return {
    id: `item-${template.name.toLowerCase().replace(/\s+/g, "-")}-${suffix}`,
    name: template.name,
    type: template.type,
    rarity: template.rarity,
  };
}

export function rollLoot(rand: () => number, suffix: string): Item {
  const template = pickWeighted(LOOT_TABLE, rand);
  return createItem(template, suffix);
}

export function getLootTableSize(): number {
  return LOOT_TABLE.length;
}
