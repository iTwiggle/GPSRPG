"use client";

import { createPortal } from "react-dom";
import DismissBackdrop from "@/components/DismissBackdrop";
import type { DailyBriefing } from "@/lib/temporal/daily-briefing";

interface DailyBriefingCardProps {
  briefing: DailyBriefing;
  open: boolean;
  onClose: () => void;
}

export default function DailyBriefingCard({
  briefing,
  open,
  onClose,
}: DailyBriefingCardProps) {
  if (!open || typeof document === "undefined") return null;

  return (
    <>
      <DismissBackdrop
        open={open}
        onDismiss={onClose}
        label="Close daily briefing"
        zIndex={1600}
      />
      {createPortal(
        <section
          className="rpg-daily-briefing"
          role="dialog"
          aria-modal="true"
          aria-labelledby="daily-briefing-title"
        >
          <header className="rpg-daily-briefing__header">
            <div>
              <p className="rpg-daily-briefing__eyebrow">Daily field briefing</p>
              <h2 id="daily-briefing-title" className="rpg-daily-briefing__title">
                {briefing.greeting}
              </h2>
            </div>
            <button
              type="button"
              className="rpg-daily-briefing__close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </header>

          <section className="rpg-daily-briefing__modifier">
            <p className="rpg-daily-briefing__modifier-label">Today&apos;s sign</p>
            <h3>{briefing.modifier.name}</h3>
            <p className="rpg-daily-briefing__modifier-blurb">{briefing.modifier.blurb}</p>
            <p className="rpg-daily-briefing__modifier-flavor">
              {briefing.modifier.flavor}
            </p>
          </section>

          {briefing.highlights.length > 0 && (
            <section className="rpg-daily-briefing__highlights">
              <h3>Field snapshot</h3>
              <ul>
                {briefing.highlights.map((highlight) => (
                  <li key={highlight.id}>
                    <span>{highlight.label}</span>
                    <span>{highlight.detail}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <button
            type="button"
            className="rpg-daily-briefing__cta"
            onClick={onClose}
          >
            Head out
          </button>
        </section>,
        document.body
      )}
    </>
  );
}
