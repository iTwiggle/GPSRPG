import { getItemSet, getSetProgressList } from "./item-catalog";
import { rollLoot } from "./loot";
import type {
  BaseCampState,
  Codex,
  EncounterResult,
  POI,
  POIType,
} from "./types";

export type DepotDoorStatus = "locked" | "ready" | "claimed";

export type PerkEffectKind = "bonus_xp" | "extra_loot";

export interface PerkEffect {
  kind: PerkEffectKind;
  amount?: number;
  rolls?: number;
  /** When set, extra loot only applies at matching site types. */
  poiType?: POIType;
}

export interface DepotDoorDefinition {
  id: string;
  name: string;
  blurb: string;
  setId: string;
  perkId: string;
  perkName: string;
  perkDescription: string;
  charges: number;
  effect: PerkEffect;
}

export const DEPOT_DOORS: DepotDoorDefinition[] = [
  {
    id: "door-travelers-stash",
    name: "Traveler's Stash",
    blurb: "A roadside locker wired to your wandering kit.",
    setId: "travelers-kit",
    perkId: "perk-road-rations",
    perkName: "Road Rations",
    perkDescription: "+10 XP per explore while charges remain.",
    charges: 5,
    effect: { kind: "bonus_xp", amount: 10 },
  },
  {
    id: "door-shrine-vault",
    name: "Shrine Vault",
    blurb: "Incense-worn reliquary doors sealed by shrine finds.",
    setId: "shrine-relics",
    perkId: "perk-sacred-key",
    perkName: "Sacred Key",
    perkDescription: "+1 loot roll at shrine sites.",
    charges: 3,
    effect: { kind: "extra_loot", rolls: 1, poiType: "shrine" },
  },
  {
    id: "door-veterans-armory",
    name: "Veteran's Armory",
    blurb: "Racked gear from long patrols, keyed to your stash set.",
    setId: "veterans-stash",
    perkId: "perk-veterans-edge",
    perkName: "Veteran's Edge",
    perkDescription: "+15 XP per explore while charges remain.",
    charges: 4,
    effect: { kind: "bonus_xp", amount: 15 },
  },
  {
    id: "door-legends-vault",
    name: "Legend's Vault",
    blurb: "Myth-grade seals that answer to hoard-tier catalogues.",
    setId: "legends-hoard",
    perkId: "perk-dragons-seal",
    perkName: "Dragon's Seal",
    perkDescription: "+1 loot roll at any site.",
    charges: 2,
    effect: { kind: "extra_loot", rolls: 1 },
  },
  {
    id: "door-smugglers-hatch",
    name: "Smuggler's Hatch",
    blurb: "Hidden panel behind cache contraband markings.",
    setId: "cache-contraband",
    perkId: "perk-contraband-route",
    perkName: "Contraband Route",
    perkDescription: "+20 XP per explore while charges remain.",
    charges: 3,
    effect: { kind: "bonus_xp", amount: 20 },
  },
  {
    id: "door-well-depths",
    name: "Well Depths",
    blurb: "Flooded chamber keyed to drowned treasures.",
    setId: "well-treasures",
    perkId: "perk-drowned-luck",
    perkName: "Drowned Luck",
    perkDescription: "+1 loot roll at well sites.",
    charges: 3,
    effect: { kind: "extra_loot", rolls: 1, poiType: "well" },
  },
];

const doorsById = new Map(DEPOT_DOORS.map((door) => [door.id, door]));
const doorsByPerkId = new Map(DEPOT_DOORS.map((door) => [door.perkId, door]));

export function createEmptyBaseCamp(): BaseCampState {
  return {
    claimedDoorIds: [],
    activePerks: [],
  };
}

export function normalizeBaseCamp(
  baseCamp: Partial<BaseCampState> | undefined
): BaseCampState {
  const empty = createEmptyBaseCamp();
  if (!baseCamp) return empty;

  return {
    claimedDoorIds: baseCamp.claimedDoorIds ?? [],
    activePerks: (baseCamp.activePerks ?? []).filter(
      (perk) =>
        perk &&
        typeof perk.perkId === "string" &&
        typeof perk.chargesRemaining === "number" &&
        perk.chargesRemaining > 0
    ),
    lastCampVisitAt: baseCamp.lastCampVisitAt,
  };
}

export function getDepotDoor(doorId: string): DepotDoorDefinition | undefined {
  return doorsById.get(doorId);
}

export function isSetCompleteForDoor(codex: Codex, setId: string): boolean {
  return getSetProgressList(codex).some(
    (progress) => progress.set.id === setId && progress.complete
  );
}

export function getDepotDoorStatus(
  door: DepotDoorDefinition,
  codex: Codex,
  baseCamp: BaseCampState
): DepotDoorStatus {
  if (baseCamp.claimedDoorIds.includes(door.id)) {
    return "claimed";
  }
  if (isSetCompleteForDoor(codex, door.setId)) {
    return "ready";
  }
  return "locked";
}

export function countReadyDepotDoors(
  codex: Codex,
  baseCamp: BaseCampState
): number {
  return DEPOT_DOORS.filter(
    (door) => getDepotDoorStatus(door, codex, baseCamp) === "ready"
  ).length;
}

export function claimDepotDoor(
  baseCamp: BaseCampState,
  doorId: string
): BaseCampState | null {
  const door = getDepotDoor(doorId);
  if (!door || baseCamp.claimedDoorIds.includes(doorId)) {
    return null;
  }

  const existing = baseCamp.activePerks.find(
    (perk) => perk.perkId === door.perkId
  );

  const activePerks = existing
    ? baseCamp.activePerks.map((perk) =>
        perk.perkId === door.perkId
          ? {
              ...perk,
              chargesRemaining: perk.chargesRemaining + door.charges,
            }
          : perk
      )
    : [
        ...baseCamp.activePerks,
        { perkId: door.perkId, chargesRemaining: door.charges },
      ];

  return {
    ...baseCamp,
    claimedDoorIds: [...baseCamp.claimedDoorIds, doorId],
    activePerks,
    lastCampVisitAt: new Date().toISOString(),
  };
}

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

/** Apply equipped field perks to an encounter and consume charges. */
export function applyActivePerksToEncounter(
  encounter: EncounterResult,
  poi: POI,
  baseCamp: BaseCampState,
  rollSeed: string | number
): {
  encounter: EncounterResult;
  baseCamp: BaseCampState;
  perkMessages: string[];
  perkBonusXp: number;
} {
  if (baseCamp.activePerks.length === 0) {
    return { encounter, baseCamp, perkMessages: [], perkBonusXp: 0 };
  }

  let xpBonus = 0;
  const extraLoot = [...encounter.loot];
  const perkMessages: string[] = [];
  const rand = seededRandom(hashSeed(rollSeed, "base-camp-perks"));
  let lootIndex = encounter.loot.length;

  const nextActivePerks = baseCamp.activePerks
    .map((activePerk) => {
      const door = doorsByPerkId.get(activePerk.perkId);
      if (!door || activePerk.chargesRemaining <= 0) {
        return activePerk;
      }

      const { effect } = door;
      let consumed = false;

      if (effect.kind === "bonus_xp" && effect.amount) {
        xpBonus += effect.amount;
        perkMessages.push(`${door.perkName}: +${effect.amount} XP`);
        consumed = true;
      }

      if (
        effect.kind === "extra_loot" &&
        effect.rolls &&
        (!effect.poiType || effect.poiType === poi.type)
      ) {
        for (let i = 0; i < effect.rolls; i += 1) {
          extraLoot.push(
            rollLoot(rand, `${poi.id}-perk-${lootIndex++}`, poi.type)
          );
        }
        perkMessages.push(`${door.perkName}: +${effect.rolls} loot`);
        consumed = true;
      }

      if (!consumed) {
        return activePerk;
      }

      return {
        ...activePerk,
        chargesRemaining: activePerk.chargesRemaining - 1,
      };
    })
    .filter((perk) => perk.chargesRemaining > 0);

  return {
    encounter: {
      ...encounter,
      xpGained: encounter.xpGained + xpBonus,
      loot: extraLoot,
    },
    baseCamp: {
      ...baseCamp,
      activePerks: nextActivePerks,
    },
    perkMessages,
    perkBonusXp: xpBonus,
  };
}

export function getActivePerkDetails(baseCamp: BaseCampState) {
  return baseCamp.activePerks
    .map((active) => {
      const door = doorsByPerkId.get(active.perkId);
      if (!door) return null;
      return {
        ...door,
        chargesRemaining: active.chargesRemaining,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

export function tryClaimDepotDoor(
  codex: Codex,
  baseCamp: BaseCampState,
  doorId: string
): BaseCampState | null {
  const door = getDepotDoor(doorId);
  if (!door) return null;
  if (getDepotDoorStatus(door, codex, baseCamp) !== "ready") return null;
  return claimDepotDoor(baseCamp, doorId);
}

export function getSetNameForDoor(door: DepotDoorDefinition): string {
  return getItemSet(door.setId)?.name ?? door.setId;
}
