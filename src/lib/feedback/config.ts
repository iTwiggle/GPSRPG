import type { ItemRarity } from "@/lib/types";
import type { SoundCue } from "./types";

/**
 * Single source of truth for every game-feel constant. Tuning the feel of the
 * app should never require touching component code — only these values.
 *
 * Timings are milliseconds; distances are px. Easings are CSS timing functions.
 */

export const EASING = {
  /** Confident deceleration for entrances and travel. */
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** Slight overshoot for pops that should feel springy/alive. */
  pop: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Symmetric for holds/pulses. */
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;

/**
 * Per-rarity presentation. Keyed by the game's real rarities today
 * (common / uncommon / rare). The ladder is intentionally extensible: adding an
 * "epic" or "legendary" tier later is a single entry here plus a matching color
 * token in `item-visual` — no component changes. `intensity` orders the tiers so
 * effects can scale generically (0 = subtle … 1 = showstopper).
 */
export interface RarityFeedback {
  intensity: number;
  /** DOM particle count on pickup (0 disables). */
  particles: number;
  /** Core particle color. */
  particleColor: string;
  /** Accent used for glows / toast edges. */
  accent: string;
  /** Vibration pattern (ms) passed to navigator.vibrate. */
  haptic: number[];
  /** Sound cue routed to the active SoundSink. */
  sound: SoundCue;
  /** Rare-tier "stop walking" beat: hold toasts longer + screen sheen. */
  showstopper: boolean;
}

export const RARITY_FEEDBACK: Record<ItemRarity, RarityFeedback> = {
  common: {
    intensity: 0,
    particles: 6,
    particleColor: "rgba(203, 213, 225, 0.9)",
    accent: "rgba(148, 163, 184, 0.9)",
    haptic: [12],
    sound: "pickup.common",
    showstopper: false,
  },
  uncommon: {
    intensity: 0.5,
    particles: 12,
    particleColor: "rgba(52, 211, 153, 0.95)",
    accent: "rgba(16, 185, 129, 0.95)",
    haptic: [16, 30, 16],
    sound: "pickup.uncommon",
    showstopper: false,
  },
  rare: {
    intensity: 1,
    particles: 22,
    particleColor: "rgba(251, 191, 36, 0.98)",
    accent: "rgba(245, 158, 11, 1)",
    haptic: [24, 44, 28, 44, 40],
    sound: "pickup.rare",
    showstopper: true,
  },
};

export function getRarityFeedback(rarity: ItemRarity): RarityFeedback {
  return RARITY_FEEDBACK[rarity] ?? RARITY_FEEDBACK.common;
}

export const XP_FLOAT = {
  /** How long a floating "+N XP" lives. */
  durationMs: 1150,
  /** Vertical travel of the number as it fades. */
  risePx: 52,
  /** Horizontal jitter so stacked numbers do not perfectly overlap. */
  jitterPx: 26,
  /** Max concurrent floats before the oldest is retired. */
  max: 6,
  colorBySource: {
    encounter: "#fbbf24",
    set: "#f59e0b",
    contract: "#38bdf8",
    salvage: "#a78bfa",
  } as const,
} as const;

export const TOAST = {
  enterMs: 260,
  holdMs: 2600,
  /** Showstopper (rare) rewards linger a beat longer. */
  showstopperHoldMs: 3800,
  exitMs: 320,
  /** Max simultaneously visible toasts; older ones are dropped. */
  max: 3,
} as const;

export const PARTICLES = {
  /** Lifetime of a single burst particle. */
  durationMs: 720,
  /** Radial travel distance range. */
  minTravelPx: 26,
  maxTravelPx: 78,
  /** Hard safety cap regardless of rarity config. */
  hardCap: 28,
} as const;

export const LEVEL_UP = {
  totalMs: 2200,
  /** Vibration when a level is earned. */
  haptic: [30, 55, 30, 55, 45] as number[],
  sound: "levelUp" as SoundCue,
} as const;

export const HAPTICS = {
  /** Master toggle for vibration. Capability is still checked at call time. */
  enabled: true,
} as const;

export const SOUND = {
  /**
   * Pickup audio is enabled by default. The built-in WebAudio sink is zero-asset
   * and rarity-aware; a future native/sample sink can replace it through the
   * existing registerSoundSink() architecture without touching gameplay.
   */
  enabled: true,
  masterVolume: 0.22,
} as const;
