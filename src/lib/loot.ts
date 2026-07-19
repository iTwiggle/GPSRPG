import {
  getLootWeightTable,
  getUniqueLootCatalogSize,
  type ItemCatalogEntry,
} from "./item-catalog";
import type { Item, POIType } from "./types";
import type { OsmContextCategory } from "./osm-context";

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
    id: `item-${template.catalogId}-${suffix}`,
    catalogId: template.catalogId,
    name: template.name,
    type: template.type,
    rarity: template.rarity,
  };
}

export function rollLoot(
  rand: () => number,
  suffix: string,
  poiType?: POIType,
  areaContext?: OsmContextCategory
): Item {
  const template = pickWeighted(
    getLootWeightTable(poiType, areaContext),
    rand
  );
  return createItem(template, suffix);
}

export function getLootTableSize(): number {
  return getUniqueLootCatalogSize();
}

export { getUniqueLootCatalogSize } from "./item-catalog";
