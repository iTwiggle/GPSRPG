import type {
  EncounterResult,
  FieldReport,
  FieldReportBestFind,
  Item,
  ItemRarity,
  POI,
  POIType,
} from "./types";
import { getPoiTypeLabel } from "./poi-flavor";

const RARITY_RANK: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
};

export function createEmptyFieldReport(
  startedAt: string = new Date().toISOString()
): FieldReport {
  return {
    startedAt,
    sitesExplored: 0,
    xpGained: 0,
    itemsFound: 0,
    poiTypesExplored: [],
    tasksCompleted: 0,
  };
}

function isValidPoiType(value: unknown): value is POIType {
  return (
    value === "shrine" ||
    value === "camp" ||
    value === "tower" ||
    value === "gate" ||
    value === "grove" ||
    value === "cache" ||
    value === "quarry" ||
    value === "well"
  );
}

function normalizeBestFind(raw: unknown): FieldReportBestFind | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const entry = raw as Partial<FieldReportBestFind>;
  if (
    typeof entry.name !== "string" ||
    !entry.name ||
    (entry.rarity !== "common" &&
      entry.rarity !== "uncommon" &&
      entry.rarity !== "rare")
  ) {
    return undefined;
  }
  return { name: entry.name, rarity: entry.rarity };
}

/** Safe defaults for saves created before field reports existed. */
export function normalizeFieldReport(raw: unknown): FieldReport {
  if (!raw || typeof raw !== "object") {
    return createEmptyFieldReport();
  }

  const parsed = raw as Partial<FieldReport>;
  const poiTypesExplored = Array.isArray(parsed.poiTypesExplored)
    ? parsed.poiTypesExplored.filter(isValidPoiType)
    : [];

  return {
    startedAt:
      typeof parsed.startedAt === "string" && parsed.startedAt
        ? parsed.startedAt
        : new Date().toISOString(),
    sitesExplored:
      typeof parsed.sitesExplored === "number" && parsed.sitesExplored >= 0
        ? parsed.sitesExplored
        : 0,
    xpGained:
      typeof parsed.xpGained === "number" && parsed.xpGained >= 0
        ? parsed.xpGained
        : 0,
    itemsFound:
      typeof parsed.itemsFound === "number" && parsed.itemsFound >= 0
        ? parsed.itemsFound
        : 0,
    bestFind: normalizeBestFind(parsed.bestFind),
    poiTypesExplored,
    tasksCompleted:
      typeof parsed.tasksCompleted === "number" && parsed.tasksCompleted >= 0
        ? parsed.tasksCompleted
        : 0,
  };
}

function isRarer(candidate: ItemRarity, current: ItemRarity): boolean {
  return RARITY_RANK[candidate] > RARITY_RANK[current];
}

function pickBestFind(
  current: FieldReportBestFind | undefined,
  loot: Item[]
): FieldReportBestFind | undefined {
  let best = current;

  for (const item of loot) {
    if (!best || isRarer(item.rarity, best.rarity)) {
      best = { name: item.name, rarity: item.rarity };
      continue;
    }
    if (item.rarity === best.rarity && item.name.localeCompare(best.name) < 0) {
      best = { name: item.name, rarity: item.rarity };
    }
  }

  return best;
}

function addPoiType(types: POIType[], poiType: POIType): POIType[] {
  if (types.includes(poiType)) {
    return types;
  }
  return [...types, poiType];
}

interface ExploreFieldReportContext {
  poi: POI;
  encounter: EncounterResult;
  taskRewardXp: number;
  tasksCompleted: number;
}

export function updateFieldReportOnExplore(
  report: FieldReport,
  { poi, encounter, taskRewardXp, tasksCompleted }: ExploreFieldReportContext
): FieldReport {
  return {
    ...report,
    sitesExplored: report.sitesExplored + 1,
    xpGained: report.xpGained + encounter.xpGained + taskRewardXp,
    itemsFound: report.itemsFound + encounter.loot.length,
    bestFind: pickBestFind(report.bestFind, encounter.loot),
    poiTypesExplored: addPoiType(report.poiTypesExplored, poi.type),
    tasksCompleted: report.tasksCompleted + tasksCompleted,
  };
}

export function hasFieldReportActivity(report: FieldReport): boolean {
  return (
    report.sitesExplored > 0 ||
    report.xpGained > 0 ||
    report.itemsFound > 0 ||
    report.tasksCompleted > 0
  );
}

export function formatFieldReportStarted(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (sameDay) {
    return `Today, ${time}`;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPoiTypesList(types: POIType[]): string {
  if (types.length === 0) {
    return "None yet";
  }
  return types.map((type) => getPoiTypeLabel(type)).join(", ");
}

function capitalizeRarity(rarity: ItemRarity): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

export function formatBestFind(bestFind?: FieldReportBestFind): string {
  if (!bestFind) {
    return "None yet";
  }
  return `${capitalizeRarity(bestFind.rarity)} ${bestFind.name}`;
}

export function summarizeFieldReport(report: FieldReport): string {
  const parts = [
    `${report.sitesExplored} site${report.sitesExplored === 1 ? "" : "s"}`,
    `${report.xpGained} XP`,
  ];
  if (report.itemsFound > 0) {
    parts.push(`${report.itemsFound} item${report.itemsFound === 1 ? "" : "s"}`);
  }
  if (report.tasksCompleted > 0) {
    parts.push(
      `${report.tasksCompleted} contract${report.tasksCompleted === 1 ? "" : "s"}`
    );
  }
  return parts.join(", ");
}
