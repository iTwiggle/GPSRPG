import { catalogItemKey } from "./catalog-key";
import type { Codex, Item, ItemRarity, POIType } from "./types";

export interface ItemCatalogEntry {
  name: string;
  type: Item["type"];
  rarity: ItemRarity;
  weight: number;
  description: string;
  setId: string;
  /** Site type that biases drops; `general` for the shared pool. */
  poiAffinity: POIType | "general";
}

export interface ItemSetDefinition {
  id: string;
  name: string;
  blurb: string;
  rewardXp: number;
}

export const ITEM_SETS: ItemSetDefinition[] = [
  {
    id: "travelers-kit",
    name: "Traveler's Kit",
    blurb: "Road-worn basics every wanderer picks up.",
    rewardXp: 20,
  },
  {
    id: "veterans-stash",
    name: "Veteran's Stash",
    blurb: "Gear worth guarding on long patrols.",
    rewardXp: 35,
  },
  {
    id: "legends-hoard",
    name: "Legend's Hoard",
    blurb: "Myth-grade finds from deep field luck.",
    rewardXp: 60,
  },
  {
    id: "shrine-relics",
    name: "Shrine Relics",
    blurb: "Offerings and charms from sacred ground.",
    rewardXp: 25,
  },
  {
    id: "camp-gear",
    name: "Camp Gear",
    blurb: "Tools left behind at roadside camps.",
    rewardXp: 25,
  },
  {
    id: "tower-signals",
    name: "Tower Signals",
    blurb: "Watchtower supplies and scout optics.",
    rewardXp: 25,
  },
  {
    id: "gate-patrol",
    name: "Gate Patrol",
    blurb: "Tokens from old border checkpoints.",
    rewardXp: 25,
  },
  {
    id: "grove-herbs",
    name: "Grove Herbs",
    blurb: "Wild remedies and beast trophies.",
    rewardXp: 25,
  },
  {
    id: "cache-contraband",
    name: "Cache Contraband",
    blurb: "Smuggler blades and hidden pouches.",
    rewardXp: 30,
  },
  {
    id: "quarry-tools",
    name: "Quarry Tools",
    blurb: "Stonecutters' kit from worked quarries.",
    rewardXp: 25,
  },
  {
    id: "well-treasures",
    name: "Well Treasures",
    blurb: "Coins and lockets from drowned depths.",
    rewardXp: 30,
  },
];

export const ITEM_CATALOG: ItemCatalogEntry[] = [
  {
    name: "Rusty Dagger",
    type: "weapon",
    rarity: "common",
    weight: 20,
    description: "Pitted iron, still sharp enough for goblins.",
    setId: "travelers-kit",
    poiAffinity: "general",
  },
  {
    name: "Traveler's Cloak",
    type: "armor",
    rarity: "common",
    weight: 18,
    description: "Mended wool that keeps off the evening chill.",
    setId: "travelers-kit",
    poiAffinity: "general",
  },
  {
    name: "Healing Draught",
    type: "consumable",
    rarity: "common",
    weight: 22,
    description: "Bitter tonic in a wax-sealed vial.",
    setId: "travelers-kit",
    poiAffinity: "general",
  },
  {
    name: "Silver Coin Pouch",
    type: "treasure",
    rarity: "common",
    weight: 15,
    description: "Light jingle of honest road wages.",
    setId: "travelers-kit",
    poiAffinity: "general",
  },
  {
    name: "Enchanted Shortbow",
    type: "weapon",
    rarity: "uncommon",
    weight: 10,
    description: "Runes along the grip warm to the touch.",
    setId: "veterans-stash",
    poiAffinity: "general",
  },
  {
    name: "Chain Vest",
    type: "armor",
    rarity: "uncommon",
    weight: 8,
    description: "Linked rings that turn a glancing blow.",
    setId: "veterans-stash",
    poiAffinity: "general",
  },
  {
    name: "Phoenix Feather",
    type: "consumable",
    rarity: "rare",
    weight: 4,
    description: "Ember-bright plume that never quite cools.",
    setId: "legends-hoard",
    poiAffinity: "general",
  },
  {
    name: "Dragon Scale",
    type: "treasure",
    rarity: "rare",
    weight: 3,
    description: "A coin-sized scale that catches light like flame.",
    setId: "legends-hoard",
    poiAffinity: "general",
  },
  {
    name: "Offering Bowl",
    type: "treasure",
    rarity: "common",
    weight: 2,
    description: "Clay bowl stained with old incense ash.",
    setId: "shrine-relics",
    poiAffinity: "shrine",
  },
  {
    name: "Spirit Charm",
    type: "consumable",
    rarity: "uncommon",
    weight: 2,
    description: "Twined cord and bone that hums near shrines.",
    setId: "shrine-relics",
    poiAffinity: "shrine",
  },
  {
    name: "Scout's Knife",
    type: "weapon",
    rarity: "common",
    weight: 2,
    description: "Short blade notched from camp chores.",
    setId: "camp-gear",
    poiAffinity: "camp",
  },
  {
    name: "Bandit Satchel",
    type: "treasure",
    rarity: "common",
    weight: 2,
    description: "Leather bag smelling of smoke and rain.",
    setId: "camp-gear",
    poiAffinity: "camp",
  },
  {
    name: "Signal Flare",
    type: "consumable",
    rarity: "common",
    weight: 2,
    description: "Tower-issue flare — handle with care.",
    setId: "tower-signals",
    poiAffinity: "tower",
  },
  {
    name: "Lookout Lens",
    type: "treasure",
    rarity: "uncommon",
    weight: 2,
    description: "Ground glass lens from a watch platform.",
    setId: "tower-signals",
    poiAffinity: "tower",
  },
  {
    name: "Rusty Gate Key",
    type: "treasure",
    rarity: "common",
    weight: 2,
    description: "Heavy key for a gate long unguarded.",
    setId: "gate-patrol",
    poiAffinity: "gate",
  },
  {
    name: "Patrol Badge",
    type: "armor",
    rarity: "common",
    weight: 2,
    description: "Tarnished badge from a forgotten patrol.",
    setId: "gate-patrol",
    poiAffinity: "gate",
  },
  {
    name: "Herb Bundle",
    type: "consumable",
    rarity: "common",
    weight: 2,
    description: "Wild mint and yarrow tied with twine.",
    setId: "grove-herbs",
    poiAffinity: "grove",
  },
  {
    name: "Beast Fang",
    type: "weapon",
    rarity: "common",
    weight: 2,
    description: "Curved fang polished smooth by forest paths.",
    setId: "grove-herbs",
    poiAffinity: "grove",
  },
  {
    name: "Smuggler's Pouch",
    type: "treasure",
    rarity: "common",
    weight: 2,
    description: "Hidden seams and a wax smuggler's mark.",
    setId: "cache-contraband",
    poiAffinity: "cache",
  },
  {
    name: "Road Runner Blade",
    type: "weapon",
    rarity: "uncommon",
    weight: 2,
    description: "Light blade favored by courier gangs.",
    setId: "cache-contraband",
    poiAffinity: "cache",
  },
  {
    name: "Stone Chisel",
    type: "weapon",
    rarity: "common",
    weight: 2,
    description: "Iron chisel chipped from quarry work.",
    setId: "quarry-tools",
    poiAffinity: "quarry",
  },
  {
    name: "Miner's Token",
    type: "treasure",
    rarity: "common",
    weight: 2,
    description: "Brass tally from a shift long ended.",
    setId: "quarry-tools",
    poiAffinity: "quarry",
  },
  {
    name: "Well Coin",
    type: "treasure",
    rarity: "common",
    weight: 2,
    description: "Corroded coin fished from deep water.",
    setId: "well-treasures",
    poiAffinity: "well",
  },
  {
    name: "Drowned Locket",
    type: "treasure",
    rarity: "uncommon",
    weight: 2,
    description: "Waterlogged locket with a blurred portrait.",
    setId: "well-treasures",
    poiAffinity: "well",
  },
];

const catalogByKey = new Map(
  ITEM_CATALOG.map((entry) => [catalogItemKey(entry), entry])
);

const setsById = new Map(ITEM_SETS.map((set) => [set.id, set]));

export function getCatalogEntry(
  item: Pick<Item, "name" | "type">
): ItemCatalogEntry | undefined {
  return catalogByKey.get(catalogItemKey(item));
}

export function getUniqueLootCatalogSize(): number {
  return ITEM_CATALOG.length;
}

export function getItemSet(setId: string): ItemSetDefinition | undefined {
  return setsById.get(setId);
}

export function getCatalogEntriesForSet(setId: string): ItemCatalogEntry[] {
  return ITEM_CATALOG.filter((entry) => entry.setId === setId);
}

export function getCatalogEntriesByAffinity(
  affinity: POIType | "general"
): ItemCatalogEntry[] {
  return ITEM_CATALOG.filter((entry) => entry.poiAffinity === affinity);
}

export interface SetProgress {
  set: ItemSetDefinition;
  discovered: number;
  total: number;
  complete: boolean;
}

export function getSetProgressList(codex: Codex): SetProgress[] {
  const discoveredKeys = new Set(Object.keys(codex.items));

  return ITEM_SETS.map((set) => {
    const entries = getCatalogEntriesForSet(set.id);
    const discovered = entries.filter((entry) =>
      discoveredKeys.has(catalogItemKey(entry))
    ).length;

    return {
      set,
      discovered,
      total: entries.length,
      complete: discovered === entries.length && entries.length > 0,
    };
  });
}

export function getNewlyCompletedSetIds(
  codex: Codex,
  completedSetIds: string[]
): string[] {
  const done = new Set(completedSetIds);
  return getSetProgressList(codex)
    .filter((progress) => progress.complete && !done.has(progress.set.id))
    .map((progress) => progress.set.id);
}

export function getSetRewardXp(setIds: string[]): number {
  return setIds.reduce(
    (sum, id) => sum + (getItemSet(id)?.rewardXp ?? 0),
    0
  );
}

/** Sets that still have undiscovered catalog entries. */
export function getIncompleteSetProgress(codex: Codex): SetProgress[] {
  return getSetProgressList(codex).filter((progress) => !progress.complete);
}

/** Sets one item away from completion (for album nudges). */
export function getAlmostCompleteSets(codex: Codex): SetProgress[] {
  return getSetProgressList(codex).filter(
    (progress) => !progress.complete && progress.total - progress.discovered === 1
  );
}

export function getCatalogKeysForSet(setId: string): string[] {
  return getCatalogEntriesForSet(setId).map((entry) => catalogItemKey(entry));
}

export function getLootWeightTable(
  poiType?: POIType
): ItemCatalogEntry[] {
  if (!poiType) {
    return ITEM_CATALOG.filter((entry) => entry.poiAffinity === "general");
  }

  return ITEM_CATALOG.filter(
    (entry) =>
      entry.poiAffinity === "general" || entry.poiAffinity === poiType
  );
}
