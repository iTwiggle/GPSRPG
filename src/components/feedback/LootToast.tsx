"use client";

import ItemIcon from "@/components/ItemIcon";
import { getRarityFeedback, TOAST } from "@/lib/feedback/config";
import { RARITY_LABEL } from "@/lib/item-visual";
import type { ToastFeedbackEvent } from "@/lib/feedback/types";

interface LootToastProps {
  toast: ToastFeedbackEvent;
  exiting: boolean;
  reducedMotion: boolean;
}

/**
 * Self-contained reward card for contexts without the encounter modal (salvage,
 * base-camp unlocks). Rarity drives the edge glow and dwell time.
 */
export default function LootToast({
  toast,
  exiting,
  reducedMotion,
}: LootToastProps) {
  const feel = getRarityFeedback(toast.rarity);
  const stateClass = exiting ? "rpg-toast--exit" : "rpg-toast--enter";
  const motionClass = reducedMotion ? "rpg-toast--reduced" : stateClass;

  return (
    <div
      className={`rpg-toast ${motionClass} ${feel.showstopper ? "rpg-toast--showstopper" : ""}`}
      style={
        {
          "--toast-accent": feel.accent,
          "--toast-enter-ms": `${TOAST.enterMs}ms`,
          "--toast-exit-ms": `${TOAST.exitMs}ms`,
        } as React.CSSProperties
      }
      role="status"
      aria-live="polite"
    >
      {toast.itemType ? (
        <ItemIcon type={toast.itemType} rarity={toast.rarity} size="md" />
      ) : (
        <span className="rpg-toast__glyph" aria-hidden="true">
          {toast.glyph ?? "✦"}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-50">
          {toast.title}
        </p>
        <p className="truncate text-[11px] uppercase tracking-wide text-slate-300/80">
          {toast.subtitle ?? RARITY_LABEL[toast.rarity]}
        </p>
      </div>
    </div>
  );
}
