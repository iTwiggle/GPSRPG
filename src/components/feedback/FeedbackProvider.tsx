"use client";

import { useEffect, useRef, useState } from "react";
import FloatingXp from "@/components/feedback/FloatingXp";
import LevelUpCelebration from "@/components/feedback/LevelUpCelebration";
import LootToast from "@/components/feedback/LootToast";
import ParticleBurst from "@/components/feedback/ParticleBurst";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  getRarityFeedback,
  LEVEL_UP,
  PARTICLES,
  TOAST,
  XP_FLOAT,
} from "@/lib/feedback/config";
import { feedback } from "@/lib/feedback/manager";
import type {
  PickupFeedbackEvent,
  ToastFeedbackEvent,
  XpSource,
} from "@/lib/feedback/types";

interface XpFloatItem {
  id: number;
  amount: number;
  source: XpSource;
  jitterX: number;
}

interface ToastItem {
  id: number;
  toast: ToastFeedbackEvent;
  exiting: boolean;
}

interface PickupItem {
  id: number;
  rarity: PickupFeedbackEvent["rarity"];
  count: number;
  showstopper: boolean;
}

interface LevelUpItem {
  id: number;
  level: number;
}

/**
 * The single visual sink for the FeedbackManager. Mounted once at the app root,
 * it subscribes to the manager and renders all transient effects in a fixed,
 * pointer-events-none overlay layered above everything (including the encounter
 * modal), so pickups compose with existing UI without blocking interaction.
 */
export default function FeedbackProvider() {
  const reducedMotion = useReducedMotion();
  const [xpFloats, setXpFloats] = useState<XpFloatItem[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pickups, setPickups] = useState<PickupItem[]>([]);
  const [levelUps, setLevelUps] = useState<LevelUpItem[]>([]);

  // Live ref so the subscription (registered once) always sees current setting.
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;

  const idRef = useRef(0);
  const timers = useRef<Set<number>>(new Set());

  useEffect(() => {
    const schedule = (fn: () => void, ms: number) => {
      const handle = window.setTimeout(() => {
        timers.current.delete(handle);
        fn();
      }, ms);
      timers.current.add(handle);
    };

    const unsubscribe = feedback.subscribe((event) => {
      const reduced = reducedRef.current;
      const id = (idRef.current += 1);

      switch (event.kind) {
        case "xp": {
          const jitterX =
            (Math.random() - 0.5) * 2 * XP_FLOAT.jitterPx;
          setXpFloats((prev) => {
            const next = [...prev, { id, amount: event.amount, source: event.source, jitterX }];
            return next.length > XP_FLOAT.max ? next.slice(-XP_FLOAT.max) : next;
          });
          schedule(
            () => setXpFloats((prev) => prev.filter((f) => f.id !== id)),
            XP_FLOAT.durationMs + 60
          );
          break;
        }

        case "pickup": {
          const feel = getRarityFeedback(event.rarity);
          setPickups((prev) => [
            ...prev,
            { id, rarity: event.rarity, count: event.count, showstopper: feel.showstopper },
          ]);
          schedule(
            () => setPickups((prev) => prev.filter((p) => p.id !== id)),
            (reduced ? 420 : PARTICLES.durationMs) + 220
          );
          break;
        }

        case "toast": {
          const feel = getRarityFeedback(event.rarity);
          const hold = feel.showstopper ? TOAST.showstopperHoldMs : TOAST.holdMs;
          setToasts((prev) => {
            const next = [...prev, { id, toast: event, exiting: false }];
            return next.length > TOAST.max ? next.slice(-TOAST.max) : next;
          });
          // Begin exit, then remove after the exit transition.
          schedule(() => {
            setToasts((prev) =>
              prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
            );
            schedule(
              () => setToasts((prev) => prev.filter((t) => t.id !== id)),
              TOAST.exitMs + 40
            );
          }, reduced ? Math.min(hold, 1600) : hold);
          break;
        }

        case "levelUp": {
          setLevelUps((prev) => [...prev, { id, level: event.level }]);
          schedule(
            () => setLevelUps((prev) => prev.filter((l) => l.id !== id)),
            (reduced ? 1400 : LEVEL_UP.totalMs) + 60
          );
          break;
        }
      }
    });

    const activeTimers = timers.current;
    return () => {
      unsubscribe();
      activeTimers.forEach((handle) => window.clearTimeout(handle));
      activeTimers.clear();
    };
  }, []);

  const hasShowstopper = pickups.some((p) => p.showstopper);

  return (
    <div className="rpg-feedback-layer" aria-live="polite">
      {hasShowstopper && !reducedMotion && (
        <div className="rpg-screen-sheen" aria-hidden="true" />
      )}

      {/* Floating XP numbers — anchored near the HUD, rising as they fade. */}
      <div className="rpg-xp-stack">
        {xpFloats.map((float) => (
          <FloatingXp
            key={float.id}
            amount={float.amount}
            source={float.source}
            jitterX={float.jitterX}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>

      {/* Center pickup particle bursts. */}
      <div className="rpg-pickup-anchor">
        {pickups.map((pickup) => {
          const feel = getRarityFeedback(pickup.rarity);
          if (reducedMotion) {
            return (
              <span
                key={pickup.id}
                className="rpg-pickup-flash"
                style={{ background: feel.accent }}
                aria-hidden="true"
              />
            );
          }
          return (
            <ParticleBurst
              key={pickup.id}
              count={feel.particles}
              color={feel.particleColor}
              seed={pickup.id}
            />
          );
        })}
      </div>

      {/* Toast stack — salvage / unlock reward cards. */}
      <div className="rpg-toast-stack">
        {toasts.map((item) => (
          <LootToast
            key={item.id}
            toast={item.toast}
            exiting={item.exiting}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>

      {/* Level-up celebration. */}
      {levelUps.map((item) => (
        <LevelUpCelebration
          key={item.id}
          level={item.level}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}
