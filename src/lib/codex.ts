import { catalogItemKey } from "./catalog-key";
import type {
  Codex,
  CodexStats,
  EncounterResult,
  Item,
  ItemRarity,
  POI,
} from "./types";

/** @deprecated Prefer catalogItemKey from catalog-key. */
export const codexItemKey = catalogItemKey;

function emptyRarityCounts(): Record<ItemRarity, number> {
  return { common: 0, uncommon: 0, rare: 0 };
}

function normalizeRarityCounts(
  raw: Partial<Record<ItemRarity, number>> | undefined
): Record<ItemRarity, number> {
  const empty = emptyRarityCounts();
  if (!raw) return empty;
  return {
    common: typeof raw.common === "number" && raw.common >= 0 ? raw.common : 0,
    uncommon:
      typeof raw.uncommon === "number" && raw.uncommon >= 0 ? raw.uncommon : 0,
    rare: typeof raw.rare === "number" && raw.rare >= 0 ? raw.rare : 0,
  };
}

function normalizeCodexStats(raw: Partial<CodexStats> | undefined): CodexStats {
  const empty = createEmptyCodex().stats;
  if (!raw) return empty;
  return {
    totalExplores:
      typeof raw.totalExplores === "number" && raw.totalExplores >= 0
        ? raw.totalExplores
        : 0,
    totalVisitedPois:
      typeof raw.totalVisitedPois === "number" && raw.totalVisitedPois >= 0
        ? raw.totalVisitedPois
        : 0,
    totalItemsFound:
      typeof raw.totalItemsFound === "number" && raw.totalItemsFound >= 0
        ? raw.totalItemsFound
        : 0,
    rarityCounts: normalizeRarityCounts(raw.rarityCounts),
  };
}

export function createEmptyCodex(): Codex {
  return {
    items: {},
    pois: {},
    encounters: {},
    stats: {
      totalExplores: 0,
      totalVisitedPois: 0,
      totalItemsFound: 0,
      rarityCounts: emptyRarityCounts(),
    },
    completedSetIds: [],
  };
}

/** Normalize codex shape. Call backfillCompletedSetIds after for legacy saves. */
export function normalizeCodex(codex: Partial<Codex> | undefined): Codex {
  const empty = createEmptyCodex();
  if (!codex) return empty;

  return {
    items: codex.items ?? empty.items,
    pois: codex.pois ?? empty.pois,
    encounters: codex.encounters ?? empty.encounters,
    stats: normalizeCodexStats(codex.stats),
    completedSetIds: Array.isArray(codex.completedSetIds)
      ? codex.completedSetIds.filter((id): id is string => typeof id === "string")
      : [],
  };
}

function recordItem(
  codex: Codex,
  item: Item,
  timestamp: string
): Codex["items"] {
  const key = catalogItemKey(item);
  const existing = codex.items[key];

  if (existing) {
    return {
      ...codex.items,
      [key]: {
        ...existing,
        countFound: existing.countFound + 1,
        lastFoundAt: timestamp,
      },
    };
  }

  return {
    ...codex.items,
    [key]: {
      name: item.name,
      rarity: item.rarity,
      type: item.type,
      countFound: 1,
      firstFoundAt: timestamp,
      lastFoundAt: timestamp,
    },
  };
}

function recordPoi(
  codex: Codex,
  poi: POI,
  timestamp: string
): { pois: Codex["pois"]; newPoi: boolean } {
  const existing = codex.pois[poi.id];

  if (existing) {
    return {
      pois: {
        ...codex.pois,
        [poi.id]: {
          ...existing,
          visitCount: existing.visitCount + 1,
          lastVisitedAt: timestamp,
        },
      },
      newPoi: false,
    };
  }

  return {
    pois: {
      ...codex.pois,
      [poi.id]: {
        poiId: poi.id,
        name: poi.name,
        type: poi.type,
        visitCount: 1,
        firstVisitedAt: timestamp,
        lastVisitedAt: timestamp,
      },
    },
    newPoi: true,
  };
}

function recordEncounter(
  codex: Codex,
  encounter: EncounterResult,
  timestamp: string
): Codex["encounters"] {
  const key = encounter.title;
  const existing = codex.encounters[key];

  if (existing) {
    return {
      ...codex.encounters,
      [key]: {
        ...existing,
        count: existing.count + 1,
        lastAt: timestamp,
      },
    };
  }

  return {
    ...codex.encounters,
    [key]: {
      title: encounter.title,
      count: 1,
      firstAt: timestamp,
      lastAt: timestamp,
    },
  };
}

function buildStats(
  prev: CodexStats,
  loot: Item[],
  newPoi: boolean
): CodexStats {
  const rarityCounts = { ...normalizeRarityCounts(prev.rarityCounts) };
  for (const item of loot) {
    rarityCounts[item.rarity] += 1;
  }

  return {
    totalExplores: prev.totalExplores + 1,
    totalVisitedPois: prev.totalVisitedPois + (newPoi ? 1 : 0),
    totalItemsFound: prev.totalItemsFound + loot.length,
    rarityCounts,
  };
}

/** Record a completed explore into the Collection Album. */
export function recordExplore(
  codex: Codex,
  poi: POI,
  encounter: EncounterResult,
  timestamp: string = new Date().toISOString()
): Codex {
  let items = codex.items;
  for (const item of encounter.loot) {
    items = recordItem({ ...codex, items }, item, timestamp);
  }

  const { pois, newPoi } = recordPoi(codex, poi, timestamp);
  const encounters = recordEncounter(codex, encounter, timestamp);
  const stats = buildStats(codex.stats, encounter.loot, newPoi);

  return {
    items,
    pois,
    encounters,
    stats,
    completedSetIds: codex.completedSetIds ?? [],
  };
}
