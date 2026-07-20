import { HAPTICS } from "./config";
import type { FeedbackEvent, FeedbackSink } from "./types";
import { getRarityFeedback, LEVEL_UP } from "./config";

function canVibrate(): boolean {
  return (
    HAPTICS.enabled &&
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  );
}

function vibrate(pattern: number[]): void {
  if (!canVibrate() || pattern.length === 0) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Vibration can throw on some locked-down browsers; never break the loop.
  }
}

/**
 * Translates semantic events into vibration patterns. Haptics are motion-adjacent
 * but not visual motion, so they are governed by their own config toggle rather
 * than the reduced-motion query.
 */
export const hapticsSink: FeedbackSink = {
  id: "haptics",
  handle(event: FeedbackEvent): void {
    switch (event.kind) {
      case "pickup":
        vibrate(getRarityFeedback(event.rarity).haptic);
        break;
      case "toast":
        vibrate(getRarityFeedback(event.rarity).haptic);
        break;
      case "milestoneBurst":
        vibrate([18, 36, 22, 36, 28]);
        break;
      case "levelUp":
        vibrate(LEVEL_UP.haptic);
        break;
      case "xp":
        // XP floats are visual-only; no haptic to avoid buzz spam per explore.
        break;
    }
  },
};
