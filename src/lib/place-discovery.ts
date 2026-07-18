import {
  getCatalogEntriesByAffinity,
  type ItemCatalogEntry,
} from "./item-catalog";
import type { NamedOsmPlace, OsmContextCategory } from "./osm-context";
import type { EncounterResult, Item, POI, POIType } from "./types";

/** One-shot relics granted only on first footfall at a named place. */
const PLACE_FOOTFALL_RELICS: Record<
  Exclude<OsmContextCategory, "generic">,
  ItemCatalogEntry
> = {
  cemetery: {
    name: "Gravewake Charm",
    type: "treasure",
    rarity: "uncommon",
    weight: 0,
    description: "Cold iron that only answers the first footfall among graves.",
    setId: "shrine-relics",
    poiAffinity: "shrine",
  },
  park_or_woods: {
    name: "Firstbloom Token",
    type: "treasure",
    rarity: "uncommon",
    weight: 0,
    description: "A warm leaf-token that only ripens on first footfall in a grove.",
    setId: "grove-herbs",
    poiAffinity: "grove",
  },
  water: {
    name: "Tidefirst Coin",
    type: "treasure",
    rarity: "uncommon",
    weight: 0,
    description: "Salt-wet coin granted once — the well remembers who arrived first.",
    setId: "well-treasures",
    poiAffinity: "well",
  },
  industrial: {
    name: "Forgefirst Slag",
    type: "treasure",
    rarity: "uncommon",
    weight: 0,
    description: "Still-warm slag from a quarry that yields only to first entry.",
    setId: "quarry-tools",
    poiAffinity: "quarry",
  },
  education: {
    name: "Primercache Seal",
    type: "treasure",
    rarity: "uncommon",
    weight: 0,
    description: "Archive wax unbroken until the first scholar steps the grounds.",
    setId: "cache-contraband",
    poiAffinity: "cache",
  },
  worship: {
    name: "Threshold Relic",
    type: "treasure",
    rarity: "uncommon",
    weight: 0,
    description: "Chapel ash pressed into a charm — only for first footfall.",
    setId: "shrine-relics",
    poiAffinity: "shrine",
  },
  transit: {
    name: "Wayfirst Badge",
    type: "armor",
    rarity: "uncommon",
    weight: 0,
    description: "A border badge that stamps only the first crossing of a place.",
    setId: "gate-patrol",
    poiAffinity: "gate",
  },
  commercial: {
    name: "Opening Stall Mark",
    type: "treasure",
    rarity: "uncommon",
    weight: 0,
    description: "Merchant chalk that only marks the first deal struck here.",
    setId: "cache-contraband",
    poiAffinity: "cache",
  },
};

function hashSeed(...values: (string | number)[]): number {
  let hash = 2166136261;
  for (const value of values) {
    const str = String(value);
    for (let i = 0; i < str.length; i += 1) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function createItem(template: ItemCatalogEntry, suffix: string): Item {
  return {
    id: `item-${template.name.toLowerCase().replace(/\s+/g, "-")}-${suffix}`,
    name: template.name,
    type: template.type,
    rarity: template.rarity,
  };
}

function pickAffinityTemplate(
  poiType: POIType,
  rand: () => number
): ItemCatalogEntry | null {
  const pool = getCatalogEntriesByAffinity(poiType).filter(
    (entry) => entry.weight > 0
  );
  if (pool.length === 0) return null;

  // Prefer uncommon affinity pieces when present — first footfall should feel rich.
  const uncommon = pool.filter((entry) => entry.rarity === "uncommon");
  const table = uncommon.length > 0 ? uncommon : pool;
  const total = table.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rand() * total;
  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return table[table.length - 1];
}

export function getFootfallRelic(
  category: Exclude<OsmContextCategory, "generic">
): ItemCatalogEntry {
  return PLACE_FOOTFALL_RELICS[category];
}

export function isPlaceDiscovered(
  placeId: string | null | undefined,
  discoveredPlaceIds: readonly string[]
): boolean {
  if (!placeId) return false;
  return discoveredPlaceIds.includes(placeId);
}

export function markPlaceDiscovered(
  discoveredPlaceIds: readonly string[],
  placeId: string
): string[] {
  if (discoveredPlaceIds.includes(placeId)) {
    return [...discoveredPlaceIds];
  }
  return [...discoveredPlaceIds, placeId];
}

/**
 * First discovery at a named place: guaranteed site-affinity loot + one-shot
 * place-type relic. Does not re-fire for later explores at the same place-id.
 */
export function applyFirstVisitPlaceBonus(
  encounter: EncounterResult,
  poi: POI,
  place: NamedOsmPlace
): EncounterResult {
  const rand = seededRandom(hashSeed(place.id, poi.id, "first-footfall"));
  const bonusLoot: Item[] = [];

  const hasAffinityDrop = encounter.loot.some((item) =>
    getCatalogEntriesByAffinity(poi.type).some(
      (entry) => entry.name === item.name && entry.type === item.type
    )
  );

  if (!hasAffinityDrop) {
    const affinity = pickAffinityTemplate(poi.type, rand);
    if (affinity) {
      bonusLoot.push(createItem(affinity, `${place.id}-affinity`));
    }
  }

  const relic = getFootfallRelic(place.category);
  bonusLoot.push(createItem(relic, `${place.id}-footfall`));

  const footfallLine = `First footfall at ${place.name} — the field answers you alone.`;

  return {
    ...encounter,
    description: `${encounter.description} ${footfallLine}`,
    loot: [...encounter.loot, ...bonusLoot],
    firstVisitPlaceName: place.name,
    firstVisitRelicName: relic.name,
  };
}
