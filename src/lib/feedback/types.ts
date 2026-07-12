import type { Item, ItemRarity } from "@/lib/types";

/**
 * Semantic "something rewarding happened" events. Systems emit these; they never
 * spawn effects directly. The FeedbackManager fans each event out to every sink
 * (visual overlay, haptics, sound), so presentation stays fully decoupled from
 * gameplay logic.
 */
export type FeedbackEvent =
  | XpFeedbackEvent
  | PickupFeedbackEvent
  | ToastFeedbackEvent
  | LevelUpFeedbackEvent;

export type XpSource = "encounter" | "set" | "contract" | "salvage";

export interface XpFeedbackEvent {
  kind: "xp";
  amount: number;
  source: XpSource;
}

/**
 * A loot acquisition "impact". Drives particles / haptics / sound scaled by the
 * best rarity in the batch. Deliberately carries no card UI — the encounter
 * modal already presents the detailed loot list, so this composes with it
 * instead of duplicating it.
 */
export interface PickupFeedbackEvent {
  kind: "pickup";
  rarity: ItemRarity;
  count: number;
  /** At least one item was catalogued for the first time. */
  isDiscovery: boolean;
}

/** A self-contained loot/reward card for contexts with no modal (salvage, unlocks). */
export interface ToastFeedbackEvent {
  kind: "toast";
  title: string;
  subtitle?: string;
  rarity: ItemRarity;
  itemType?: Item["type"];
  /** Optional glyph override; falls back to the item-type glyph. */
  glyph?: string;
}

export interface LevelUpFeedbackEvent {
  kind: "levelUp";
  level: number;
}

export type FeedbackEventKind = FeedbackEvent["kind"];

/** A sink consumes every event. Visual overlay, haptics, and sound are sinks. */
export interface FeedbackSink {
  readonly id: string;
  handle(event: FeedbackEvent): void;
}

/** Abstract sound cue. Concrete sinks decide how (or whether) to render audio. */
export type SoundCue =
  | "pickup.common"
  | "pickup.uncommon"
  | "pickup.rare"
  | "xp"
  | "levelUp"
  | "toast";

export interface SoundSink {
  play(cue: SoundCue, options?: { volume?: number }): void;
}
