import type { OsmContextCategory } from "./osm-context";
import type { POIType } from "./types";

export type EncounterKind =
  | "goblin"
  | "chest"
  | "shrine"
  | "wanderer"
  | "empty";

export const POI_TYPES: POIType[] = [
  "shrine",
  "camp",
  "tower",
  "gate",
  "grove",
  "cache",
  "quarry",
  "well",
];

interface PoiTypeFlavor {
  label: string;
  namePrefixes: string[];
  nameSuffixes: string[];
  epithets: string[];
  descriptors: string[];
}

export const POI_TYPE_FLAVOR: Record<POIType, PoiTypeFlavor> = {
  shrine: {
    label: "Shrine",
    namePrefixes: ["Moonlit", "Whispering", "Sacred", "Hidden", "Veiled"],
    nameSuffixes: ["Shrine", "Altar", "Sanctum", "Shrinestone"],
    epithets: ["of Spirits", "of Offerings", "of Ash", "of Echoes"],
    descriptors: [
      "Offerings rustle in a faint, watchful breeze.",
      "Relic-scorch marks circle a cracked stone basin.",
      "Someone left fresh petals beside a faded spirit mark.",
    ],
  },
  camp: {
    label: "Camp",
    namePrefixes: ["Bandit", "Nomad", "Abandoned", "Forsaken", "Ragged"],
    nameSuffixes: ["Camp", "Outpost", "Hideout", "Bivouac"],
    epithets: ["of Scouts", "of Raiders", "of the Watch", "of Ashes"],
    descriptors: [
      "Cold fire pits and scuffed boot prints.",
      "Supply crates lie half-open, picked over in haste.",
      "A torn banner flaps between two lean tents.",
    ],
  },
  tower: {
    label: "Tower",
    namePrefixes: ["Broken", "Ivory", "Warded", "Lonely", "Soot-stained"],
    nameSuffixes: ["Spire", "Watchtower", "Bastion", "Pinnacle"],
    epithets: ["of Signals", "of Warnings", "of Embers", "of the Lookout"],
    descriptors: [
      "A crooked signal fire crows still watch the road.",
      "Old mage-chalk sigils cling to the inner stair.",
      "Wind whistles through arrow slits like a warning horn.",
    ],
  },
  gate: {
    label: "Gate",
    namePrefixes: ["Fallen", "Forgotten", "Crumbling", "Sealed", "Broken"],
    nameSuffixes: ["Gate", "Arch", "Threshold", "Passage"],
    epithets: ["of Ruins", "of Patrols", "of the Old Road", "of Locks"],
    descriptors: [
      "A broken arch marks where the old road ended.",
      "Rusty chains hang from a gate that no longer closes.",
      "Patrol marks score the stones beneath the lintel.",
    ],
  },
  grove: {
    label: "Grove",
    namePrefixes: ["Thorn", "Misty", "Enchanted", "Dark", "Verdant"],
    nameSuffixes: ["Grove", "Thicket", "Glade", "Copse"],
    epithets: ["of Herbs", "of Beasts", "of Strange Growth", "of Druids"],
    descriptors: [
      "Herbs grow thick where the path forgets itself.",
      "Beast tracks circle a ring of pale mushrooms.",
      "Vines twist into shapes that feel almost deliberate.",
    ],
  },
  cache: {
    label: "Cache",
    namePrefixes: ["Hidden", "Smuggler", "Buried", "Secret", "Forgotten"],
    nameSuffixes: ["Cache", "Stash", "Hollow", "Cavity"],
    epithets: ["of Goods", "of Runners", "of Old Supplies", "of the Road"],
    descriptors: [
      "Fresh scratches hide something under loose stone.",
      "Smuggler chalk marks fade on a nearby boulder.",
      "A hollow sounds empty — but not for long.",
    ],
  },
  quarry: {
    label: "Quarry",
    namePrefixes: ["Abandoned", "Sunken", "Choked", "Grim", "Sun-bleached"],
    nameSuffixes: ["Quarry", "Pit", "Cut", "Yard"],
    epithets: ["of Stone", "of Tools", "of Bones", "of the Delve"],
    descriptors: [
      "Half-cut blocks and abandoned iron picks.",
      "Buried bones show through a collapsed gravel slide.",
      "Mining relics lie rusted beside a dry winch.",
    ],
  },
  well: {
    label: "Well",
    namePrefixes: ["Still", "Echoing", "Haunted", "Sunken", "Forgotten"],
    nameSuffixes: ["Well", "Cistern", "Spring", "Shaft"],
    epithets: ["of Coins", "of Echoes", "of Drowned Things", "of Whispers"],
    descriptors: [
      "Something rings deep when the wind crosses the lip.",
      "Coins glint beneath the water like sunken eyes.",
      "Damp echoes climb the shaft with every footstep.",
    ],
  },
};

export const ENCOUNTER_FLAVOR: Partial<
  Record<
    POIType,
    Partial<Record<EncounterKind, { title: string; description: string }>>
  >
> = {
  shrine: {
    goblin: {
      title: "Curse Stirred",
      description: "A spiteful spirit lashes out before fading with a sigh.",
    },
    chest: {
      title: "Relic Niche",
      description: "You find offerings tucked behind a cracked altar stone.",
    },
    shrine: {
      title: "Blessed Shrine",
      description: "Ancient runes glow as you pay respects among the relics.",
    },
    wanderer: {
      title: "Pilgrim's Gift",
      description: "A weary pilgrim shares water and a small blessed charm.",
    },
    empty: {
      title: "Quiet Vigil",
      description: "Incense ash and silence — the spirits watch but do not speak.",
    },
  },
  camp: {
    goblin: {
      title: "Bandit Skirmish",
      description: "Scouts leap from the camp's edge. You drive them off.",
    },
    chest: {
      title: "Raider's Stash",
      description: "You pry open a supply crate buried beneath the tents.",
    },
    wanderer: {
      title: "Camp Straggler",
      description: "A nervous deserter trades gossip for rations.",
    },
    empty: {
      title: "Empty Bivouac",
      description: "The camp holds only ash rings and hurried footprints.",
    },
  },
  tower: {
    goblin: {
      title: "Lookout Alarm",
      description: "A sentry goblin rings a bell — you silence it quickly.",
    },
    chest: {
      title: "Signal Locker",
      description: "A locker beneath the brazier still holds emergency stores.",
    },
    shrine: {
      title: "Watcher's Blessing",
      description: "Old ward-sigils flare, then settle as you pass.",
    },
    empty: {
      title: "Silent Watch",
      description: "The tower stands empty, but the view still feels judged.",
    },
  },
  gate: {
    goblin: {
      title: "Gate Ambush",
      description: "Something small darts from the ruins of the guard post.",
    },
    chest: {
      title: "Toll Cache",
      description: "A locked toll box yields coins and a rusted key.",
    },
    empty: {
      title: "Threshold Quiet",
      description: "Wind moans through the arch — no patrol answers.",
    },
  },
  grove: {
    goblin: {
      title: "Beast Lunge",
      description: "A feral creature bursts from the undergrowth and flees.",
    },
    chest: {
      title: "Druid's Hollow",
      description: "A moss-lined hollow hides bundled herbs and trinkets.",
    },
    wanderer: {
      title: "Herb Gatherer",
      description: "A grove-tender shares a poultice and a wary nod.",
    },
    empty: {
      title: "Grove Stillness",
      description: "Leaves rustle without wind — then fall quiet again.",
    },
  },
  cache: {
    chest: {
      title: "Smuggler's Cache",
      description: "You uncover a weathered stash tucked among loose stone.",
    },
    goblin: {
      title: "Cache Thief",
      description: "A scavenger was already pawing through the hideout.",
    },
    empty: {
      title: "Picked Clean",
      description: "Someone got here first — only chalk marks remain.",
    },
  },
  quarry: {
    chest: {
      title: "Miner's Strongbox",
      description: "A tool chest still holds pay and a few polished stones.",
    },
    goblin: {
      title: "Pit Scavenger",
      description: "A grubby scavenger scrambles from the gravel and runs.",
    },
    empty: {
      title: "Quarry Silence",
      description: "Stone dust hangs in the air; the pit holds no answers.",
    },
  },
  well: {
    chest: {
      title: "Coin Hoard",
      description: "You fish up a pouch tangled on the well rope.",
    },
    shrine: {
      title: "Well Blessing",
      description: "The water stills as you whisper an old roadside prayer.",
    },
    empty: {
      title: "Deep Echo",
      description: "Your voice returns from below — changed, but alone.",
    },
  },
};

const BASE_TYPE_WEIGHT = 1;

const CONTEXT_TYPE_WEIGHTS: Record<
  OsmContextCategory,
  Partial<Record<POIType, number>>
> = {
  cemetery: {
    shrine: 3,
    gate: 2.5,
    well: 2,
    tower: 1,
    grove: 0.5,
    camp: 0.5,
    cache: 0.5,
    quarry: 0.25,
  },
  park_or_woods: {
    grove: 3.5,
    camp: 2,
    cache: 1.5,
    shrine: 1,
    well: 1,
    gate: 0.75,
    tower: 0.5,
    quarry: 0.25,
  },
  water: {
    well: 3.5,
    shrine: 2,
    gate: 1.5,
    grove: 1,
    cache: 1,
    camp: 0.75,
    tower: 0.5,
    quarry: 0.25,
  },
  marsh: {
    grove: 3.5,
    well: 2.5,
    cache: 2,
    shrine: 1.5,
    camp: 1,
    gate: 0.75,
    tower: 0.5,
    quarry: 0.25,
  },
  industrial: {
    quarry: 3.5,
    camp: 2,
    tower: 1.5,
    cache: 1,
    gate: 1,
    shrine: 0.5,
    grove: 0.25,
    well: 0.25,
  },
  education: {
    cache: 2.5,
    tower: 2.5,
    shrine: 2,
    gate: 1.5,
    camp: 1,
    grove: 0.75,
    well: 0.75,
    quarry: 0.5,
  },
  worship: {
    shrine: 3.5,
    gate: 2,
    tower: 1.5,
    well: 1,
    grove: 0.75,
    cache: 0.75,
    camp: 0.5,
    quarry: 0.25,
  },
  transit: {
    gate: 3,
    camp: 2.5,
    tower: 2,
    cache: 1.5,
    shrine: 1,
    grove: 0.5,
    well: 0.5,
    quarry: 0.5,
  },
  commercial: {
    cache: 1.25,
    camp: 1.1,
    gate: 1.1,
    shrine: 1,
    tower: 1,
    grove: 1,
    well: 1,
    quarry: 1,
  },
  generic: {},
};

const CONTEXT_NAME_SUFFIXES: Partial<
  Record<OsmContextCategory, string[]>
> = {
  cemetery: ["Crypt", "Spirit Gate", "Memorial Altar", "Bone Shrine"],
  park_or_woods: [
    "Druid Circle",
    "Beast Trail",
    "Herb Patch",
    "Verdant Hollow",
  ],
  water: ["Drowned Altar", "River Shrine", "Old Dock", "Moonwell"],
  marsh: ["Reed Hollow", "Bog Shrine", "Mist Glade", "Sedge Patch"],
  industrial: ["Forge", "Goblin Works", "Rust Yard", "Stone Pit"],
  education: ["Archive", "Academy", "Old Study", "Lore Cache"],
  worship: ["Chapel", "Relic Site", "Blessing Shrine", "Sanctuary"],
  transit: ["Waygate", "Crossroads", "Caravan Stop", "Signal Arch"],
  commercial: ["Trader's Nook", "Roadside Stall", "Coin Post"],
};

const CONTEXT_DESCRIPTORS: Partial<Record<OsmContextCategory, string[]>> = {
  cemetery: [
    "Grave dust clings to the stones like old ash.",
    "A cold hush gathers where memorial paths cross.",
    "Spirit marks fade beside cracked headstone rubble.",
  ],
  park_or_woods: [
    "Beast tracks weave through herbs and fallen leaves.",
    "Druid chalk circles a patch of strange, bright growth.",
    "The canopy muffles the road until the trail feels older.",
  ],
  water: [
    "Damp stone glistens where the water once ran close.",
    "Old mooring rings rust beside a forgotten crossing.",
    "The air tastes of river mist and drowned echoes.",
  ],
  marsh: [
    "Reeds whisper over black mud and standing water.",
    "Marsh blooms cling to the bank in pale violet clusters.",
    "Bitter herb-scent rises where the trail sinks into bog.",
  ],
  industrial: [
    "Soot-stained scrap and half-forged iron litter the ground.",
    "Goblin work-chalk marks a path through rusted debris.",
    "Stone chips and forge ash suggest labor long abandoned.",
  ],
  education: [
    "Faded lecture chalk and stacked lore-slates gather dust.",
    "Archive seals crumble on shelves of forgotten study.",
    "Scholar marks hint at secrets once catalogued here.",
  ],
  worship: [
    "Blessing wax and relic-scorch marks ring a quiet altar.",
    "A chapel hush lingers though no choir answers.",
    "Offerings rustle beneath a cracked sanctum lintel.",
  ],
  transit: [
    "Worn crossroad stones still bear caravan chalk.",
    "A waygate arch leans where old routes once met.",
    "Signal posts and rope hooks mark a forgotten stop.",
  ],
  commercial: [
    "Merchant chalk and coin-scrape marks edge the stones.",
    "A roadside nook still smells faintly of trade and dust.",
    "Old stall pegs and crate scrap suggest hurried commerce.",
  ],
};

function pickFrom<T>(items: T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)];
}

function weightedPick<T extends string>(
  weights: Record<T, number>,
  rand: () => number
): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rand() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

export function pickPoiType(
  context: OsmContextCategory,
  rand: () => number
): POIType {
  const contextWeights = CONTEXT_TYPE_WEIGHTS[context];
  const weights = {} as Record<POIType, number>;

  for (const type of POI_TYPES) {
    weights[type] = contextWeights[type] ?? BASE_TYPE_WEIGHT;
  }

  return weightedPick(weights, rand);
}

export function getPoiTypeLabel(type: POIType): string {
  return POI_TYPE_FLAVOR[type].label;
}

export function buildPoiName(
  type: POIType,
  rand: () => number,
  context: OsmContextCategory = "generic"
): string {
  const flavor = POI_TYPE_FLAVOR[type];
  const prefix = pickFrom(flavor.namePrefixes, rand);
  const contextSuffixes = CONTEXT_NAME_SUFFIXES[context];
  const suffixPool =
    contextSuffixes && context !== "generic" && rand() < 0.45
      ? [...flavor.nameSuffixes, ...contextSuffixes]
      : flavor.nameSuffixes;
  const suffix = pickFrom(suffixPool, rand);
  if (flavor.epithets.length > 0 && rand() < 0.3) {
    const epithet = pickFrom(flavor.epithets, rand);
    return `${prefix} ${epithet} ${suffix}`;
  }
  return `${prefix} ${suffix}`;
}

export function pickPoiFlavor(
  type: POIType,
  rand: () => number,
  context: OsmContextCategory = "generic"
): string {
  const contextDescriptors = CONTEXT_DESCRIPTORS[context];
  const descriptorPool =
    contextDescriptors && context !== "generic" && rand() < 0.4
      ? [...POI_TYPE_FLAVOR[type].descriptors, ...contextDescriptors]
      : POI_TYPE_FLAVOR[type].descriptors;
  return pickFrom(descriptorPool, rand);
}

export function applyEncounterFlavor(
  poiType: POIType,
  kind: EncounterKind,
  fallback: { title: string; description: string }
): { title: string; description: string } {
  return ENCOUNTER_FLAVOR[poiType]?.[kind] ?? fallback;
}
