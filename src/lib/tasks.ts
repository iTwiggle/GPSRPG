import { catalogItemKey } from "./catalog-key";
import {
  getCatalogEntry,
  getCatalogKeysForSet,
  getIncompleteSetProgress,
  getItemSet,
} from "./item-catalog";
import { getPoiTypeLabel } from "./poi-flavor";
import { hashSeed, seededRandom } from "./random";
import type {
  Codex,
  EncounterResult,
  FieldTask,
  FieldTaskType,
  POI,
  POIType,
} from "./types";

export const FIELD_TASK_SLOT_COUNT = 3;

interface TaskTemplate {
  type: FieldTaskType;
  target: number;
  title: string;
  description: string;
  rewardXp: number;
}

const ALL_POI_TYPES: POIType[] = [
  "shrine",
  "camp",
  "tower",
  "gate",
  "grove",
  "cache",
  "quarry",
  "well",
];

const TASK_TEMPLATES: TaskTemplate[] = [
  {
    type: "explore_pois",
    target: 3,
    title: "Field Contract: Survey 3 sites",
    description: "Explore three nearby fantasy sites on this outing.",
    rewardXp: 15,
  },
  {
    type: "explore_poi_types",
    target: 2,
    title: "Field Contract: 2 site kinds",
    description: "Visit two different kinds of sites (e.g. shrine and camp).",
    rewardXp: 20,
  },
  {
    type: "find_items",
    target: 2,
    title: "Field Contract: Recover 2 finds",
    description: "Loot two items from encounters while exploring.",
    rewardXp: 15,
  },
  {
    type: "find_uncommon_plus",
    target: 1,
    title: "Field Contract: Uncommon+ relic",
    description: "Find at least one uncommon or rare item.",
    rewardXp: 25,
  },
  {
    type: "gain_xp",
    target: 100,
    title: "Field Contract: Earn 100 XP",
    description: "Gain 100 XP from encounters on this outing.",
    rewardXp: 20,
  },
  {
    type: "complete_poi_type",
    target: 1,
    title: "Field Contract: Clear 1 site",
    description: "Complete one site of a specific type.",
    rewardXp: 20,
  },
  {
    type: "trigger_encounters",
    target: 3,
    title: "Field Contract: 3 encounters",
    description: "Trigger three encounters while exploring sites.",
    rewardXp: 15,
  },
  {
    type: "catalog_set_items",
    target: 2,
    title: "Field Contract: Album set hunt",
    description: "Catalog items from a specific album set while exploring.",
    rewardXp: 30,
  },
];

function makeTaskId(seed: number, index: number): string {
  return `task-${seed}-${index}`;
}

function buildCatalogSetTask(
  setId: string,
  seed: number,
  index: number,
  timestamp: string,
  codex: Codex
): FieldTask {
  const itemSet = getItemSet(setId);
  const setKeys = getCatalogKeysForSet(setId);
  const discoveredKeys = new Set(Object.keys(codex.items));
  const missing = setKeys.filter((key) => !discoveredKeys.has(key)).length;
  const target = Math.min(3, Math.max(1, missing));
  const id = makeTaskId(seed, index);

  return {
    id,
    type: "catalog_set_items",
    title: `Field Contract: ${itemSet?.name ?? "Album set"}`,
    description: `Find ${target} item${target === 1 ? "" : "s"} from the ${itemSet?.name ?? "album set"} while exploring.`,
    target,
    progress: 0,
    status: "active",
    rewardXp: 30,
    setId,
    catalogKeysSeen: [],
    createdAt: timestamp,
  };
}

function buildTaskFromTemplate(
  template: TaskTemplate,
  seed: number,
  index: number,
  timestamp: string,
  codex?: Codex
): FieldTask {
  const id = makeTaskId(seed, index);

  if (template.type === "catalog_set_items") {
    const incomplete = codex ? getIncompleteSetProgress(codex) : [];
    if (incomplete.length === 0) {
      return buildTaskFromTemplate(
        TASK_TEMPLATES.find((t) => t.type === "find_items")!,
        seed,
        index,
        timestamp,
        codex
      );
    }
    const rand = seededRandom(hashSeed(seed, index, "album-set"));
    const pick = incomplete[Math.floor(rand() * incomplete.length)];
    return buildCatalogSetTask(pick.set.id, seed, index, timestamp, codex!);
  }

  if (template.type === "complete_poi_type") {
    const rand = seededRandom(hashSeed(seed, index, "poi-type"));
    const poiType = ALL_POI_TYPES[Math.floor(rand() * ALL_POI_TYPES.length)];
    const label = getPoiTypeLabel(poiType);
    return {
      id,
      type: template.type,
      title: `Field Contract: Clear 1 ${label}`,
      description: `Complete one ${label.toLowerCase()} site on this outing.`,
      target: template.target,
      progress: 0,
      status: "active",
      rewardXp: template.rewardXp,
      poiType,
      createdAt: timestamp,
    };
  }

  return {
    id,
    type: template.type,
    title: template.title,
    description: template.description,
    target: template.target,
    progress: 0,
    status: "active",
    rewardXp: template.rewardXp,
    poiTypesSeen: template.type === "explore_poi_types" ? [] : undefined,
    createdAt: timestamp,
  };
}

function pickDistinctTemplates(
  rand: () => number,
  count: number,
  poolSource: TaskTemplate[] = TASK_TEMPLATES
): TaskTemplate[] {
  const pool = [...poolSource];
  const picked: TaskTemplate[] = [];

  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return picked;
}

/** Generate a fresh set of field contracts. */
export function generateFieldTasks(
  seed: number = Date.now(),
  codex?: Codex
): FieldTask[] {
  const rand = seededRandom(hashSeed(seed, "field-tasks"));
  const pool = codex?.items
    ? TASK_TEMPLATES.filter(
        (template) =>
          template.type !== "catalog_set_items" ||
          getIncompleteSetProgress(codex).length > 0
      )
    : TASK_TEMPLATES.filter((template) => template.type !== "catalog_set_items");
  const templates = pickDistinctTemplates(rand, FIELD_TASK_SLOT_COUNT, pool);
  const timestamp = new Date().toISOString();

  return templates.map((template, index) =>
    buildTaskFromTemplate(template, seed, index, timestamp, codex)
  );
}

/** Ensure saves always have exactly three valid task slots. */
export function normalizeFieldTasks(
  tasks: unknown,
  codex?: Codex
): FieldTask[] {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return generateFieldTasks(Date.now(), codex);
  }

  const normalized = tasks
    .filter((task): task is FieldTask => {
      if (!task || typeof task !== "object") return false;
      const t = task as FieldTask;
      return (
        typeof t.id === "string" &&
        typeof t.type === "string" &&
        typeof t.title === "string" &&
        typeof t.target === "number" &&
        typeof t.progress === "number" &&
        (t.status === "active" || t.status === "completed")
      );
    })
    .slice(0, FIELD_TASK_SLOT_COUNT);

  if (normalized.length < FIELD_TASK_SLOT_COUNT) {
    const filler = generateFieldTasks(
      hashSeed("fill", normalized.length),
      codex
    );
    while (normalized.length < FIELD_TASK_SLOT_COUNT) {
      normalized.push(filler[normalized.length]);
    }
  }

  return normalized;
}

export function refreshFieldTasks(codex?: Codex): FieldTask[] {
  return generateFieldTasks(Date.now(), codex);
}

export interface ExploreTaskContext {
  poi: POI;
  encounter: EncounterResult;
}

function countUncommonPlus(loot: EncounterResult["loot"]): number {
  return loot.filter((item) => item.rarity !== "common").length;
}

function advanceTask(task: FieldTask, ctx: ExploreTaskContext): FieldTask {
  if (task.status === "completed") {
    return task;
  }

  let progress = task.progress;
  let poiTypesSeen = task.poiTypesSeen;

  switch (task.type) {
    case "explore_pois":
    case "trigger_encounters":
      progress += 1;
      break;
    case "explore_poi_types": {
      const seen = poiTypesSeen ?? [];
      if (!seen.includes(ctx.poi.type)) {
        poiTypesSeen = [...seen, ctx.poi.type];
      } else {
        poiTypesSeen = seen;
      }
      progress = poiTypesSeen.length;
      break;
    }
    case "find_items":
      progress += ctx.encounter.loot.length;
      break;
    case "find_uncommon_plus":
      progress += countUncommonPlus(ctx.encounter.loot);
      break;
    case "gain_xp":
      progress += ctx.encounter.xpGained;
      break;
    case "complete_poi_type":
      if (task.poiType && ctx.poi.type === task.poiType) {
        progress += 1;
      }
      break;
    case "catalog_set_items": {
      if (!task.setId) break;
      const seen = new Set(task.catalogKeysSeen ?? []);
      for (const item of ctx.encounter.loot) {
        const entry = getCatalogEntry(item);
        const key = catalogItemKey(item);
        if (entry?.setId === task.setId && !seen.has(key)) {
          seen.add(key);
        }
      }
      progress = seen.size;
      return progress >= task.target
        ? {
            ...task,
            progress: Math.min(progress, task.target),
            catalogKeysSeen: [...seen],
            status: "completed",
            completedAt: new Date().toISOString(),
          }
        : {
            ...task,
            progress: Math.min(progress, task.target),
            catalogKeysSeen: [...seen],
          };
    }
    default:
      break;
  }

  progress = Math.min(progress, task.target);

  if (progress >= task.target) {
    return {
      ...task,
      progress,
      poiTypesSeen,
      status: "completed",
      completedAt: new Date().toISOString(),
    };
  }

  return {
    ...task,
    progress,
    poiTypesSeen,
  };
}

export interface ApplyExploreToTasksResult {
  tasks: FieldTask[];
  completions: FieldTask[];
}

/** Update active field tasks from a successful explore. */
export function applyExploreToTasks(
  tasks: FieldTask[],
  ctx: ExploreTaskContext
): ApplyExploreToTasksResult {
  const completions: FieldTask[] = [];
  const nextTasks = tasks.map((task) => {
    const wasActive = task.status === "active";
    const updated = advanceTask(task, ctx);
    if (wasActive && updated.status === "completed") {
      completions.push(updated);
    }
    return updated;
  });

  return { tasks: nextTasks, completions };
}
