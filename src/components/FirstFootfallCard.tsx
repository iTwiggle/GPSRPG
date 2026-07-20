"use client";

import { useEffect } from "react";
import type { CellArrivalBrief } from "@/lib/world/cell-arrival";

const AUTO_DISMISS_MS = 12_000;

interface FirstFootfallCardProps {
  brief: CellArrivalBrief;
  open: boolean;
  onDismiss: () => void;
}

export default function FirstFootfallCard({
  brief,
  open,
  onDismiss,
}: FirstFootfallCardProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [open, onDismiss, brief.cellKey]);

  if (!open) return null;

  return (
    <div className="rpg-footfall-card-wrap" aria-live="polite">
      <section
        className="rpg-footfall-card"
        role="status"
        aria-labelledby="footfall-title"
      >
        <header className="rpg-footfall-card__header">
          <div>
            <p className="rpg-footfall-card__eyebrow">First footfall</p>
            <h2 id="footfall-title" className="rpg-footfall-card__title">
              {brief.placeLabel}
            </h2>
          </div>
          <button
            type="button"
            className="rpg-footfall-card__close"
            onClick={onDismiss}
            aria-label="Dismiss first footfall briefing"
          >
            ×
          </button>
        </header>

        <p className="rpg-footfall-card__headline">{brief.headline}</p>

        {brief.forageHint && (
          <p className="rpg-footfall-card__hint">{brief.forageHint}</p>
        )}

        {brief.craftNudge && (
          <p className="rpg-footfall-card__craft">{brief.craftNudge}</p>
        )}
      </section>
    </div>
  );
}
