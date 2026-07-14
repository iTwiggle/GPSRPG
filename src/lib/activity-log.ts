import type {
  ActivityEvent,
  ActivityEventType,
  EncounterResult,
  FieldReport,
  FieldTask,
  Item,
  POI,
} from "./types";
import { hasFieldReportActivity, summarizeFieldReport } from "./field-report";

export const ACTIVITY_LOG_MAX = 50;

export function createEmptyActivityLog(): ActivityEvent[] {
  return [];
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function makeId(timestamp: string, type: ActivityEventType, index: number): string {
  return `act-${timestamp}-${type}-${index}`;
}

interface BuildContext {
  poi: POI;
  encounter: EncounterResult;
  prevLevel: number;
  newLevel: number;
}

/**
 * Build the events for a single explore in narrative order:
 *   1. POI explored
 *   2. Encounter
 *   3. XP gained
 *   4. Items found (one per loot drop)
 *   5. Level up (if leveled)
 */
function buildExploreEvents(
  { poi, encounter, prevLevel, newLevel }: BuildContext,
  timestamp: string
): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  let index = 0;

  events.push({
    id: makeId(timestamp, "poi_explored", index++),
    timestamp,
    type: "poi_explored",
    message: `Explored ${poi.name}`,
    poiType: poi.type,
  });

  events.push({
    id: makeId(timestamp, "encounter", index++),
    timestamp,
    type: "encounter",
    message: `Encountered ${encounter.title}`,
  });

  if (encounter.xpGained > 0) {
    events.push({
      id: makeId(timestamp, "xp_gained", index++),
      timestamp,
      type: "xp_gained",
      message: `Gained ${encounter.xpGained} XP`,
    });
  }

  for (const item of encounter.loot) {
    events.push({
      id: makeId(timestamp, "item_found", index++),
      timestamp,
      type: "item_found",
      message: `Found ${capitalize(item.rarity)} ${item.name}`,
      rarity: item.rarity,
      itemType: item.type,
    });
  }

  if (newLevel > prevLevel) {
    events.push({
      id: makeId(timestamp, "level_up", index++),
      timestamp,
      type: "level_up",
      message: `Reached Level ${newLevel}`,
    });
  }

  return events;
}

/**
 * Prepend a single explore's events (in narrative order) to the activity log,
 * keeping newest explore batches first and capping the log at ACTIVITY_LOG_MAX.
 */
export function appendExploreEvents(
  log: ActivityEvent[],
  ctx: { poi: POI; encounter: EncounterResult; prevLevel: number; newLevel: number },
  timestamp: string = new Date().toISOString()
): ActivityEvent[] {
  const batch = buildExploreEvents(ctx, timestamp);
  const next = [...batch, ...log];
  if (next.length > ACTIVITY_LOG_MAX) {
    next.length = ACTIVITY_LOG_MAX;
  }
  return next;
}

interface ItemTemplate {
  rarity: Item["rarity"];
  name: string;
}

/** Helper for tests/devtools: build a single item-found message. */
export function formatItemFoundMessage(item: ItemTemplate): string {
  return `Found ${capitalize(item.rarity)} ${item.name}`;
}

function prependEvents(
  log: ActivityEvent[],
  batch: ActivityEvent[]
): ActivityEvent[] {
  const next = [...batch, ...log];
  if (next.length > ACTIVITY_LOG_MAX) {
    next.length = ACTIVITY_LOG_MAX;
  }
  return next;
}

/** Append task-completion events (contract fulfilled + optional level-up). */
export function appendTaskCompleteEvents(
  log: ActivityEvent[],
  completions: FieldTask[],
  prevLevel: number,
  newLevel: number,
  timestamp: string = new Date().toISOString()
): ActivityEvent[] {
  if (completions.length === 0) {
    return log;
  }

  const events: ActivityEvent[] = [];
  let index = 0;

  for (const task of completions) {
    events.push({
      id: makeId(timestamp, "task_complete", index++),
      timestamp,
      type: "task_complete",
      message: `Contract fulfilled: ${task.title.replace(/^Field Contract: /, "")} (+${task.rewardXp} XP)`,
    });
  }

  if (newLevel > prevLevel) {
    events.push({
      id: makeId(timestamp, "level_up", index++),
      timestamp,
      type: "level_up",
      message: `Reached Level ${newLevel}`,
    });
  }

  return prependEvents(log, events);
}

/** Append album set completion rewards after an explore. */
export function appendSetCompleteEvents(
  log: ActivityEvent[],
  setCompletions: { id: string; name: string; rewardXp: number }[],
  prevLevel: number,
  newLevel: number,
  timestamp: string = new Date().toISOString()
): ActivityEvent[] {
  if (setCompletions.length === 0) {
    return log;
  }

  const events: ActivityEvent[] = [];
  let index = 0;

  for (const set of setCompletions) {
    events.push({
      id: makeId(timestamp, "set_complete", index++),
      timestamp,
      type: "set_complete",
      message: `Album set complete: ${set.name} (+${set.rewardXp} XP)`,
    });
  }

  if (newLevel > prevLevel) {
    events.push({
      id: makeId(timestamp, "level_up", index++),
      timestamp,
      type: "level_up",
      message: `Reached Level ${newLevel}`,
    });
  }

  return prependEvents(log, events);
}

/** Log field report archive + new outing start when the player resets their report. */
export function appendFieldReportEvents(
  log: ActivityEvent[],
  previousReport: FieldReport,
  timestamp: string = new Date().toISOString()
): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  let index = 0;

  if (hasFieldReportActivity(previousReport)) {
    events.push({
      id: makeId(timestamp, "field_report", index++),
      timestamp,
      type: "field_report",
      message: `Field report filed: ${summarizeFieldReport(previousReport)}`,
    });
  }

  events.push({
    id: makeId(timestamp, "field_report", index++),
    timestamp,
    type: "field_report",
    message: "Started new field report",
  });

  return prependEvents(log, events);
}
