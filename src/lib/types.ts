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
  | "ruins"
  | "shrine"
  | "cave"
  | "tower"
  | "camp"
  | "forest"
  | "lake";

export interface POI {
  id: string;
  name: string;
  type: POIType;
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

export interface GameState {
  player: Player;
  visitedPOIIds: string[];
}

export const EXPLORE_RADIUS_METERS = 150;

export const DEMO_POSITION: Position = {
  lat: 37.7749,
  lng: -122.4194,
};
