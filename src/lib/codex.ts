import type {
  Codex,
  CodexStats,
  EncounterResult,
  Item,
  ItemRarity,
  POI,
} from "./types";

function emptyRarityCounts(): Record<ItemRarity, number> {
  return { common: 0, uncommon: 0, rare: 0 };
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

export function normalizeCodex(codex: Partial<Codex> | undefined): Codex {
  const empty = createEmptyCodex();
  if (!codex) return empty;

  return {
    items: codex.items ?? empty.items,
    pois: codex.pois ?? empty.pois,
    encounters: codex.encounters ?? empty.encounters,
    stats: codex.stats ?? empty.stats,
    completedSetIds: codex.completedSetIds ?? [],
  };
}

function itemKey(item: Pick<Item, "name" | "type">): string {
  return `${item.name}|${item.type}`;
}

export { itemKey as codexItemKey };

function recordItem(
  codex: Codex,
  item: Item,
  timestamp: string
): Codex["items"] {
  const key = itemKey(item);
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
  const rarityCounts = { ...prev.rarityCounts };
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

/** Record a completed explore into the collection log. */
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

  return { items, pois, encounters, stats, completedSetIds: codex.completedSetIds ?? [] };
}
