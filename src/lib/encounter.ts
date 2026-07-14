import { applyEncounterFlavor, type EncounterKind } from "./poi-flavor";
import { hashSeed, seededRandom } from "./prng";
import { rollLoot } from "./loot";
import type { EncounterResult, POI, POIType } from "./types";

interface EncounterTemplate {
  kind: EncounterKind;
  weight: number;
  title: string;
  description: string;
  xp: number;
  lootRolls: number;
}

const BASE_ENCOUNTERS: EncounterTemplate[] = [
  {
    kind: "goblin",
    weight: 28,
    title: "Goblin Ambush",
    description: "A scrappy goblin leaps from the brush. You prevail!",
    xp: 25,
    lootRolls: 0,
  },
  {
    kind: "chest",
    weight: 22,
    title: "Hidden Cache",
    description: "You uncover a weathered chest tucked among the stones.",
    xp: 10,
    lootRolls: 1,
  },
  {
    kind: "shrine",
    weight: 18,
    title: "Blessed Shrine",
    description: "Ancient runes glow as you pay respects to the shrine.",
    xp: 35,
    lootRolls: 1,
  },
  {
    kind: "wanderer",
    weight: 17,
    title: "Friendly Wanderer",
    description: "A traveling merchant shares tales and a small gift.",
    xp: 15,
    lootRolls: 1,
  },
  {
    kind: "empty",
    weight: 15,
    title: "Quiet Exploration",
    description: "The site holds only wind and distant birdsong.",
    xp: 5,
    lootRolls: 0,
  },
];

const POI_BONUS: Partial<Record<POIType, { xp: number; lootRolls: number }>> = {
  shrine: { xp: 10, lootRolls: 0 },
  camp: { xp: 3, lootRolls: 1 },
  tower: { xp: 8, lootRolls: 0 },
  gate: { xp: 5, lootRolls: 1 },
  grove: { xp: 4, lootRolls: 0 },
  cache: { xp: 5, lootRolls: 1 },
  quarry: { xp: 4, lootRolls: 1 },
  well: { xp: 6, lootRolls: 1 },
};

function pickEncounter(rand: () => number): EncounterTemplate {
  const total = BASE_ENCOUNTERS.reduce((sum, e) => sum + e.weight, 0);
  let roll = rand() * total;
  for (const encounter of BASE_ENCOUNTERS) {
    roll -= encounter.weight;
    if (roll <= 0) {
      return encounter;
    }
  }
  return BASE_ENCOUNTERS[BASE_ENCOUNTERS.length - 1];
}

/** Roll an encounter when exploring a POI. Deterministic per POI id for testing. */
export function rollEncounter(
  poi: POI,
  rollSeed?: number
): EncounterResult {
  const seed = rollSeed ?? hashSeed(poi.id);
  const rand = seededRandom(seed);
  const template = pickEncounter(rand);
  const bonus = POI_BONUS[poi.type] ?? { xp: 0, lootRolls: 0 };

  const loot = Array.from(
    { length: template.lootRolls + bonus.lootRolls },
    (_, i) => rollLoot(rand, `${poi.id}-${i}`, poi.type)
  );

  const flavored = applyEncounterFlavor(poi.type, template.kind, {
    title: template.title,
    description: template.description,
  });

  return {
    title: flavored.title,
    description: flavored.description,
    xpGained: template.xp + bonus.xp,
    loot,
  };
}
