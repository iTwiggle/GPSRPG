import { applyEncounterFlavor, type EncounterKind } from "./poi-flavor";
import { rollLoot } from "./loot";
import type {
  EncounterApproachId,
  EncounterApproachOutcome,
  EncounterResult,
  POI,
  POIType,
} from "./types";

interface EncounterTemplate {
  kind: EncounterKind;
  weight: number;
  title: string;
  description: string;
  xp: number;
  lootRolls: number;
}

export interface EncounterApproach {
  id: EncounterApproachId;
  label: string;
  tone: "safe" | "risky";
  kicker: string;
  description: string;
  tradeoff: string;
}

export interface PendingEncounter {
  poi: POI;
  approaches: [EncounterApproach, EncounterApproach];
  simulate: boolean;
}

interface ApproachCopy {
  surveyLabel: string;
  surveyDescription: string;
  delveLabel: string;
  delveDescription: string;
}

const APPROACH_COPY: Record<POIType, ApproachCopy> = {
  shrine: {
    surveyLabel: "Read the signs",
    surveyDescription:
      "Study the offerings and old wards before touching anything.",
    delveLabel: "Break the seal",
    delveDescription:
      "Press through the shrine's oldest ward and claim what answers.",
  },
  camp: {
    surveyLabel: "Scout the perimeter",
    surveyDescription: "Circle the camp, read its tracks, and take the clean opening.",
    delveLabel: "Raid the tents",
    delveDescription: "Move fast through the heart of camp before anything returns.",
  },
  tower: {
    surveyLabel: "Study the tower",
    surveyDescription: "Read the signal marks and search the stable lower rooms.",
    delveLabel: "Climb the broken stair",
    delveDescription:
      "Risk the unstable ascent for whatever waits above the skyline.",
  },
  gate: {
    surveyLabel: "Trace the old road",
    surveyDescription:
      "Inspect the toll marks and approach the threshold on known stone.",
    delveLabel: "Cross the threshold",
    delveDescription: "Step through the ruined arch and follow the road nobody uses.",
  },
  grove: {
    surveyLabel: "Read the tracks",
    surveyDescription:
      "Follow the outer trail and gather what the grove reveals freely.",
    delveLabel: "Enter the thicket",
    delveDescription: "Push past the warning growth toward the grove's tangled center.",
  },
  cache: {
    surveyLabel: "Check the markings",
    surveyDescription:
      "Decode the smuggler signs and open only the safest compartment.",
    delveLabel: "Dig it open",
    delveDescription: "Pull the whole hiding place apart before its owner comes back.",
  },
  quarry: {
    surveyLabel: "Inspect the cut",
    surveyDescription: "Search the worked ledges and keep clear of the unstable drop.",
    delveLabel: "Descend into the pit",
    delveDescription:
      "Take the abandoned winch down where the richest seams were left.",
  },
  well: {
    surveyLabel: "Listen at the rim",
    surveyDescription:
      "Test the echoes and work the old rope without disturbing the depths.",
    delveLabel: "Lower the rope",
    delveDescription: "Commit your weight to the shaft and reach for the deepest glint.",
  },
};

const EMPTY_ENCOUNTER: EncounterTemplate = {
  kind: "empty",
  weight: 15,
  title: "Quiet Exploration",
  description: "The site holds only wind and distant birdsong.",
  xp: 5,
  lootRolls: 0,
};

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
  EMPTY_ENCOUNTER,
];

const PAYOFF_ENCOUNTERS = BASE_ENCOUNTERS.filter(
  (encounter) => encounter.kind !== "empty"
);
const DELVE_SETBACK_CHANCE = 0.34;
const SURVEY_MIN_XP = 15;

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

function pickEncounter(
  rand: () => number,
  encounters: EncounterTemplate[]
): EncounterTemplate {
  const total = encounters.reduce(
    (sum, encounter) => sum + encounter.weight,
    0
  );
  let roll = rand() * total;
  for (const encounter of encounters) {
    roll -= encounter.weight;
    if (roll <= 0) return encounter;
  }
  return encounters[encounters.length - 1];
}

export function getEncounterApproaches(
  poi: POI
): [EncounterApproach, EncounterApproach] {
  const copy = APPROACH_COPY[poi.type];

  return [
    {
      id: "survey",
      label: copy.surveyLabel,
      tone: "safe",
      kicker: "Measured approach",
      description: copy.surveyDescription,
      tradeoff: "Dependable XP · restrained loot",
    },
    {
      id: "delve",
      label: copy.delveLabel,
      tone: "risky",
      kicker: "Bold approach",
      description: copy.delveDescription,
      tradeoff: "Higher loot ceiling · may come up thin",
    },
  ];
}

/**
 * Resolve a chosen site approach. The POI id and approach are always part of
 * the seed, so closing and reopening a site cannot be used to reroll it.
 */
export function rollEncounter(
  poi: POI,
  approachId: EncounterApproachId = "survey",
  rollSeed?: string | number
): EncounterResult {
  const seed = hashSeed(rollSeed ?? poi.id, approachId);
  const rand = seededRandom(seed);
  const bonus = POI_BONUS[poi.type] ?? { xp: 0, lootRolls: 0 };
  const approach = getEncounterApproaches(poi).find(
    (candidate) => candidate.id === approachId
  )!;

  const setback = approachId === "delve" && rand() < DELVE_SETBACK_CHANCE;
  const template = setback
    ? EMPTY_ENCOUNTER
    : pickEncounter(rand, PAYOFF_ENCOUNTERS);

  let xpGained: number;
  let lootRolls: number;
  let approachOutcome: EncounterApproachOutcome;

  if (approachId === "survey") {
    xpGained = Math.max(SURVEY_MIN_XP, template.xp + bonus.xp);
    lootRolls = Math.min(1, template.lootRolls + bonus.lootRolls);
    approachOutcome = "steady";
  } else if (setback) {
    xpGained = template.xp + Math.floor(bonus.xp / 2);
    lootRolls = 0;
    approachOutcome = "setback";
  } else {
    xpGained = template.xp + bonus.xp + 5;
    lootRolls = template.lootRolls + bonus.lootRolls + 1;
    approachOutcome = "payoff";
  }

  const loot = Array.from({ length: lootRolls }, (_, index) =>
    rollLoot(rand, `${poi.id}-${approachId}-${index}`, poi.type)
  );

  const flavored = applyEncounterFlavor(poi.type, template.kind, {
    title: template.title,
    description: template.description,
  });

  return {
    title: flavored.title,
    description: flavored.description,
    xpGained,
    loot,
    approachId,
    approachLabel: approach.label,
    approachOutcome,
  };
}
