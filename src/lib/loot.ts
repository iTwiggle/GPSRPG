import type { Item, ItemRarity, POIType } from "./types";

type LootTemplate = {
  name: string;
  type: Item["type"];
  rarity: ItemRarity;
  weight: number;
};

const LOOT_TABLE: LootTemplate[] = [
  { name: "Rusty Dagger", type: "weapon", rarity: "common", weight: 20 },
  { name: "Traveler's Cloak", type: "armor", rarity: "common", weight: 18 },
  { name: "Healing Draught", type: "consumable", rarity: "common", weight: 22 },
  { name: "Silver Coin Pouch", type: "treasure", rarity: "common", weight: 15 },
  { name: "Enchanted Shortbow", type: "weapon", rarity: "uncommon", weight: 10 },
  { name: "Chain Vest", type: "armor", rarity: "uncommon", weight: 8 },
  { name: "Phoenix Feather", type: "consumable", rarity: "rare", weight: 4 },
  { name: "Dragon Scale", type: "treasure", rarity: "rare", weight: 3 },
];

const TYPE_LOOT: Partial<Record<POIType, LootTemplate[]>> = {
  shrine: [
    { name: "Offering Bowl", type: "treasure", rarity: "common", weight: 2 },
    { name: "Spirit Charm", type: "consumable", rarity: "uncommon", weight: 2 },
  ],
  camp: [
    { name: "Scout's Knife", type: "weapon", rarity: "common", weight: 2 },
    { name: "Bandit Satchel", type: "treasure", rarity: "common", weight: 2 },
  ],
  tower: [
    { name: "Signal Flare", type: "consumable", rarity: "common", weight: 2 },
    { name: "Lookout Lens", type: "treasure", rarity: "uncommon", weight: 2 },
  ],
  gate: [
    { name: "Rusty Gate Key", type: "treasure", rarity: "common", weight: 2 },
    { name: "Patrol Badge", type: "armor", rarity: "common", weight: 2 },
  ],
  grove: [
    { name: "Herb Bundle", type: "consumable", rarity: "common", weight: 2 },
    { name: "Beast Fang", type: "weapon", rarity: "common", weight: 2 },
  ],
  cache: [
    { name: "Smuggler's Pouch", type: "treasure", rarity: "common", weight: 2 },
    { name: "Road Runner Blade", type: "weapon", rarity: "uncommon", weight: 2 },
  ],
  quarry: [
    { name: "Stone Chisel", type: "weapon", rarity: "common", weight: 2 },
    { name: "Miner's Token", type: "treasure", rarity: "common", weight: 2 },
  ],
  well: [
    { name: "Well Coin", type: "treasure", rarity: "common", weight: 2 },
    { name: "Drowned Locket", type: "treasure", rarity: "uncommon", weight: 2 },
  ],
};

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

function createItem(template: LootTemplate, suffix: string): Item {
  return {
    id: `item-${template.name.toLowerCase().replace(/\s+/g, "-")}-${suffix}`,
    name: template.name,
    type: template.type,
    rarity: template.rarity,
  };
}

function getLootTable(poiType?: POIType): LootTemplate[] {
  if (!poiType) return LOOT_TABLE;
  const themed = TYPE_LOOT[poiType];
  if (!themed) return LOOT_TABLE;
  return [...LOOT_TABLE, ...themed];
}

export function rollLoot(
  rand: () => number,
  suffix: string,
  poiType?: POIType
): Item {
  const template = pickWeighted(getLootTable(poiType), rand);
  return createItem(template, suffix);
}

export function getLootTableSize(): number {
  return LOOT_TABLE.length;
}

/** Count of unique item templates across base and POI-themed loot tables. */
export function getUniqueLootCatalogSize(): number {
  const keys = new Set<string>();

  for (const template of LOOT_TABLE) {
    keys.add(`${template.name}|${template.type}`);
  }

  for (const themed of Object.values(TYPE_LOOT)) {
    if (!themed) continue;
    for (const template of themed) {
      keys.add(`${template.name}|${template.type}`);
    }
  }

  return keys.size;
}
