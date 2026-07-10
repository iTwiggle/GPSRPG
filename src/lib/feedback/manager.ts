import { hapticsSink } from "./haptics";
import { soundSink } from "./sound";
import type {
  FeedbackEvent,
  LevelUpFeedbackEvent,
  PickupFeedbackEvent,
  ToastFeedbackEvent,
  XpFeedbackEvent,
} from "./types";

type Listener = (event: FeedbackEvent) => void;

/**
 * The FeedbackManager is the one place gameplay talks to for "juice". Systems
 * call `feedback.emit(...)` (or a typed helper) and never spawn effects directly.
 *
 * It fans every event out to registered sinks:
 *   - always-on non-visual sinks (haptics, sound) added at construction, and
 *   - the DOM overlay sink (installed by FeedbackProvider on mount).
 *
 * Framework-agnostic on purpose: callable from hooks, lib code, or tests.
 */
class FeedbackManager {
  private listeners = new Set<Listener>();

  constructor() {
    this.subscribe((event) => hapticsSink.handle(event));
    this.subscribe((event) => soundSink.handle(event));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: FeedbackEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // One misbehaving sink must never break gameplay or other sinks.
      }
    }
  }

  emitXp(amount: number, source: XpFeedbackEvent["source"]): void {
    if (amount <= 0) return;
    this.emit({ kind: "xp", amount, source });
  }

  emitPickup(
    rarity: PickupFeedbackEvent["rarity"],
    count: number,
    isDiscovery: boolean
  ): void {
    this.emit({ kind: "pickup", rarity, count, isDiscovery });
  }

  emitToast(toast: Omit<ToastFeedbackEvent, "kind">): void {
    this.emit({ kind: "toast", ...toast });
  }

  emitLevelUp(level: LevelUpFeedbackEvent["level"]): void {
    this.emit({ kind: "levelUp", level });
  }
}

/**
 * App-wide singleton, pinned to globalThis.
 *
 * Next.js can bundle this module into more than one client chunk. A plain
 * module-level singleton would then diverge; pinning to globalThis guarantees a
 * single shared instance regardless of bundling.
 */
const globalRef = globalThis as typeof globalThis & {
  __gpsrpgFeedback?: FeedbackManager;
};

export const feedback: FeedbackManager =
  globalRef.__gpsrpgFeedback ?? (globalRef.__gpsrpgFeedback = new FeedbackManager());

export type { FeedbackEvent } from "./types";
