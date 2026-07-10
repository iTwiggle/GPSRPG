import {
  getLootWeightTable,
  type ItemCatalogEntry,
} from "./item-catalog";
import type { Item, POIType } from "./types";

export { getUniqueLootCatalogSize } from "./item-catalog";

function pickWeighted(
  table: ItemCatalogEntry[],
  rand: () => number
): ItemCatalogEntry {
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

function createItem(template: ItemCatalogEntry, suffix: string): Item {
  return {
    id: `item-${template.name.toLowerCase().replace(/\s+/g, "-")}-${suffix}`,
    name: template.name,
    type: template.type,
    rarity: template.rarity,
  };
}

export function rollLoot(
  rand: () => number,
  suffix: string,
  poiType?: POIType
): Item {
  const template = pickWeighted(getLootWeightTable(poiType), rand);
  return createItem(template, suffix);
}
