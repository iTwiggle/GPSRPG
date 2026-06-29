export type ItemRarity = "common" | "uncommon" | "rare";

export interface Item {
  id: string;
  name: string;
  type: "weapon" | "armor" | "consumable" | "treasure";
  rarity: ItemRarity;
}

export interface Player {
  name: string;
  level: number;
  xp: number;
  inventory: Item[];
}

export type POIType =
  | "shrine"
  | "camp"
  | "tower"
  | "gate"
  | "grove"
  | "cache"
  | "quarry"
  | "well";

export interface POI {
  id: string;
  name: string;
  type: POIType;
  flavor: string;
  lat: number;
  lng: number;
}

export interface Position {
  lat: number;
  lng: number;
}

export interface EncounterResult {
  title: string;
  description: string;
  xpGained: number;
  loot: Item[];
}

export interface CodexItemEntry {
  name: string;
  rarity: ItemRarity;
  type: Item["type"];
  countFound: number;
  firstFoundAt: string;
  lastFoundAt: string;
}

export interface CodexPoiEntry {
  poiId: string;
  name: string;
  type: POIType;
  visitCount: number;
  firstVisitedAt: string;
  lastVisitedAt: string;
}

export interface CodexEncounterEntry {
  title: string;
  count: number;
  firstAt: string;
  lastAt: string;
}

export interface CodexStats {
  totalExplores: number;
  totalVisitedPois: number;
  totalItemsFound: number;
  rarityCounts: Record<ItemRarity, number>;
}

export interface Codex {
  items: Record<string, CodexItemEntry>;
  pois: Record<string, CodexPoiEntry>;
  encounters: Record<string, CodexEncounterEntry>;
  stats: CodexStats;
}

export type ActivityEventType =
  | "poi_explored"
  | "encounter"
  | "xp_gained"
  | "item_found"
  | "level_up"
  | "task_complete"
  | "field_report";

export type FieldTaskType =
  | "explore_pois"
  | "explore_poi_types"
  | "find_items"
  | "find_uncommon_plus"
  | "gain_xp"
  | "complete_poi_type"
  | "trigger_encounters";

export type FieldTaskStatus = "active" | "completed";

export interface FieldTask {
  id: string;
  type: FieldTaskType;
  title: string;
  description: string;
  target: number;
  progress: number;
  status: FieldTaskStatus;
  rewardXp: number;
  poiType?: POIType;
  poiTypesSeen?: POIType[];
  createdAt: string;
  completedAt?: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: ActivityEventType;
  message: string;
  rarity?: ItemRarity;
  itemType?: Item["type"];
  poiType?: POIType;
}

export interface FieldReportBestFind {
  name: string;
  rarity: ItemRarity;
}

export interface FieldReport {
  startedAt: string;
  sitesExplored: number;
  xpGained: number;
  itemsFound: number;
  bestFind?: FieldReportBestFind;
  poiTypesExplored: POIType[];
  tasksCompleted: number;
}

export interface GameState {
  player: Player;
  visitedPOIIds: string[];
  codex: Codex;
  activityLog: ActivityEvent[];
  fieldTasks: FieldTask[];
  fieldReport: FieldReport;
}

export const EXPLORE_RADIUS_METERS = 150;

/** Fixed fallback coordinates for desktop testing only — not the player's real location. */
export const DEMO_POSITION: Position = {
  lat: 37.7749,
  lng: -122.4194,
};

export const DEMO_LOCATION_LABEL = "Demo Location";
