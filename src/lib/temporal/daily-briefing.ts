import { countReadyDepotDoors } from "@/lib/base-camp";
import { getAlmostCompleteSets } from "@/lib/item-catalog";
import { metersToLeagues } from "@/lib/movement/movement-ledger";
import { canReExplorePoi } from "@/lib/temporal/poi-cooldowns";
import {
  getCooldownMultiplierForPoi,
  getWorldModifierForDate,
  type WorldModifier,
} from "@/lib/temporal/world-modifier";
import { getExpeditionProgress } from "@/lib/expedition";
import { getLocalDateString } from "@/lib/tasks";
import type { GameState, POI } from "@/lib/types";

export interface BriefingHighlight {
  id: string;
  label: string;
  detail: string;
}

export interface DailyBriefing {
  date: string;
  greeting: string;
  modifier: WorldModifier;
  highlights: BriefingHighlight[];
}

export function shouldShowDailyBriefing(
  state: GameState,
  date: string = getLocalDateString()
): boolean {
  return state.companionMeta?.lastBriefingSeenDate !== date;
}

export function markDailyBriefingSeen(
  state: GameState,
  date: string = getLocalDateString()
): GameState {
  return {
    ...state,
    companionMeta: {
      ...state.companionMeta,
      lastBriefingSeenDate: date,
    },
  };
}

function countReadySites(
  pois: POI[],
  visitedPois: GameState["visitedPois"],
  modifier: WorldModifier
): number {
  return pois.filter((poi) =>
    canReExplorePoi(visitedPois[poi.id], poi.type, Date.now(), {
      cooldownMultiplier: getCooldownMultiplierForPoi(modifier, poi.type),
    })
  ).length;
}

export function buildDailyBriefing(
  state: GameState,
  pois: POI[] = [],
  date: string = getLocalDateString()
): DailyBriefing {
  const modifier = getWorldModifierForDate(date);
  const fulfilled = state.fieldTasks.filter(
    (task) => task.status === "completed"
  ).length;
  const percent = getExpeditionProgress(state.fieldTasks);
  const highlights: BriefingHighlight[] = [];

  highlights.push({
    id: "contracts",
    label: "Field contracts",
    detail: `${fulfilled}/${state.fieldTasks.length} complete · ${percent}% expedition`,
  });

  const leaguesToday = metersToLeagues(state.movementLedger.todayMeters);
  if (leaguesToday > 0) {
    highlights.push({
      id: "trail",
      label: "Trail effort",
      detail: `${leaguesToday} league${leaguesToday === 1 ? "" : "s"} charted today`,
    });
  }

  const readyDoors = countReadyDepotDoors(state.codex, state.baseCamp);
  if (readyDoors > 0) {
    highlights.push({
      id: "depot",
      label: "Base camp",
      detail: `${readyDoors} depot door${readyDoors === 1 ? "" : "s"} ready to open`,
    });
  }

  const almost = getAlmostCompleteSets(state.codex);
  if (almost.length > 0) {
    const set = almost[0]!.set;
    highlights.push({
      id: "album",
      label: "Album board",
      detail: `One find from completing ${set.name}`,
    });
  }

  const readySites = countReadySites(pois, state.visitedPois, modifier);
  if (readySites > 0) {
    highlights.push({
      id: "sites",
      label: "Nearby sites",
      detail: `${readySites} site${readySites === 1 ? "" : "s"} ready to explore`,
    });
  }

  const name = state.player.name.trim() || "Wayfarer";
  const greeting =
    leaguesToday > 0
      ? `Welcome back, ${name}. The field remembers your steps.`
      : `Good outing, ${name}. The map awaits.`;

  return {
    date,
    greeting,
    modifier,
    highlights,
  };
}
