import { rollLoot } from "@/lib/loot";
import { hashSeed, seededRandom } from "@/lib/prng";
import { getLocalDateString } from "@/lib/tasks";
import type { EncounterResult, POI, POIType } from "@/lib/types";

export type WorldModifierKind =
  | "bonus_xp_all"
  | "bonus_xp_poi"
  | "extra_loot_poi"
  | "cooldown_discount";

export interface WorldModifier {
  id: string;
  name: string;
  blurb: string;
  flavor: string;
  kind: WorldModifierKind;
  poiTypes?: POIType[];
  amount?: number;
  cooldownMultiplier?: number;
}

export const WORLD_MODIFIERS: WorldModifier[] = [
  {
    id: "trail-bounty",
    name: "Trail Bounty",
    blurb: "+8 XP on every site explore today.",
    flavor: "The paths feel generous — wanderers earn a little extra for showing up.",
    kind: "bonus_xp_all",
    amount: 8,
  },
  {
    id: "grove-harvest",
    name: "Grove Harvest",
    blurb: "+1 loot roll at Grove sites today.",
    flavor: "Wild groves spill extra herbs and trophies to the careful scout.",
    kind: "extra_loot_poi",
    poiTypes: ["grove"],
    amount: 1,
  },
  {
    id: "shrine-blessing",
    name: "Shrine Blessing",
    blurb: "+12 XP at Shrine sites today.",
    flavor: "Sacred ground answers pilgrims with a brighter spark of progress.",
    kind: "bonus_xp_poi",
    poiTypes: ["shrine"],
    amount: 12,
  },
  {
    id: "quick-cache",
    name: "Quick Cache",
    blurb: "Cache and Quarry sites cool down 50% faster today.",
    flavor: "Hidden stashes and worked stone seem to refill their secrets sooner.",
    kind: "cooldown_discount",
    poiTypes: ["cache", "quarry"],
    cooldownMultiplier: 0.5,
  },
  {
    id: "patrol-wind",
    name: "Patrol Wind",
    blurb: "+12 XP at Camp sites today.",
    flavor: "Roadside camps reward swift boots and bold detours.",
    kind: "bonus_xp_poi",
    poiTypes: ["camp"],
    amount: 12,
  },
];

const modifiersById = new Map(WORLD_MODIFIERS.map((modifier) => [modifier.id, modifier]));

export function getWorldModifierForDate(
  date: string = getLocalDateString()
): WorldModifier {
  const index =
    Math.abs(hashSeed(date, "world-modifier-of-the-day")) %
    WORLD_MODIFIERS.length;
  return WORLD_MODIFIERS[index]!;
}

export function getWorldModifierById(id: string): WorldModifier | undefined {
  return modifiersById.get(id);
}

export function getCooldownMultiplierForPoi(
  modifier: WorldModifier,
  poiType: POIType
): number {
  if (modifier.kind !== "cooldown_discount") return 1;
  if (!modifier.poiTypes?.includes(poiType)) return 1;
  return modifier.cooldownMultiplier ?? 1;
}

export function getTodayCooldownOptions(
  poiType: POIType,
  date: string = getLocalDateString()
) {
  const modifier = getWorldModifierForDate(date);
  const multiplier = getCooldownMultiplierForPoi(modifier, poiType);
  return multiplier === 1 ? undefined : { cooldownMultiplier: multiplier };
}

export function applyWorldModifierToEncounter(
  encounter: EncounterResult,
  poi: POI,
  modifier: WorldModifier,
  rollSeed: string | number
): {
  encounter: EncounterResult;
  modifierMessage?: string;
} {
  let xpBonus = 0;
  const extraLoot = [...encounter.loot];
  const messages: string[] = [];

  if (modifier.kind === "bonus_xp_all" && modifier.amount) {
    xpBonus += modifier.amount;
    messages.push(`${modifier.name}: +${modifier.amount} XP`);
  }

  if (
    modifier.kind === "bonus_xp_poi" &&
    modifier.amount &&
    modifier.poiTypes?.includes(poi.type)
  ) {
    xpBonus += modifier.amount;
    messages.push(`${modifier.name}: +${modifier.amount} XP`);
  }

  if (
    modifier.kind === "extra_loot_poi" &&
    modifier.amount &&
    modifier.poiTypes?.includes(poi.type)
  ) {
    const rand = seededRandom(hashSeed(rollSeed, modifier.id));
    for (let i = 0; i < modifier.amount; i += 1) {
      extraLoot.push(rollLoot(rand, `${poi.id}-world-${i}`, poi.type));
    }
    messages.push(`${modifier.name}: +${modifier.amount} loot`);
  }

  if (xpBonus === 0 && extraLoot.length === encounter.loot.length) {
    return { encounter };
  }

  return {
    encounter: {
      ...encounter,
      xpGained: encounter.xpGained + xpBonus,
      loot: extraLoot,
    },
    modifierMessage: messages.join(" · "),
  };
}
