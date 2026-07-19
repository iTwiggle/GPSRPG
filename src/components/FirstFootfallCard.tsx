"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import DismissBackdrop from "@/components/DismissBackdrop";
import type { CellArrivalBrief } from "@/lib/world/cell-arrival";

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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return (
    <>
      <DismissBackdrop
        open={open}
        onDismiss={onDismiss}
        label="Dismiss first footfall briefing"
        zIndex={1500}
      />
      {createPortal(
        <section
          className="rpg-footfall-card"
          role="dialog"
          aria-modal="true"
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
              aria-label="Dismiss"
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

          <button
            type="button"
            className="rpg-footfall-card__continue"
            onClick={onDismiss}
          >
            Continue exploring
          </button>
        </section>,
        document.body
      )}
    </>
  );
}
