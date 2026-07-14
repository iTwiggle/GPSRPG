"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import DismissBackdrop from "@/components/DismissBackdrop";
import type { TravelerSynopsis } from "@/lib/companion/traveler-synopsis";

interface TravelerSynopsisCardProps {
  synopsis: TravelerSynopsis;
  open: boolean;
  onClose: () => void;
}

function formatMissingNudge(
  missing: TravelerSynopsis["sanctum"]["craftingNudges"][number]["missing"]
): string {
  return missing
    .map((gap) => `${gap.shortfall} more ${gap.label}`)
    .join(" · ");
}

export default function TravelerSynopsisCard({
  synopsis,
  open,
  onClose,
}: TravelerSynopsisCardProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const { fieldStats, albumNudge, activePerks, sanctum } = synopsis;

  return (
    <>
      <DismissBackdrop
        open={open}
        onDismiss={onClose}
        label="Close traveler synopsis"
        zIndex={1500}
      />
      {createPortal(
        <section
          className="rpg-traveler-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="traveler-synopsis-title"
        >
          <header className="rpg-traveler-card__header">
            <div>
              <p className="rpg-traveler-card__eyebrow">Traveler synopsis</p>
              <h2 id="traveler-synopsis-title" className="rpg-traveler-card__title">
                {synopsis.playerName}
              </h2>
              <p className="rpg-traveler-card__subtitle">
                Level {fieldStats.level} · {fieldStats.xpToNext} XP to next rank
              </p>
            </div>
            <button
              type="button"
              className="rpg-traveler-card__close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </header>

          <dl className="rpg-traveler-card__stats">
            <div>
              <dt>Bag</dt>
              <dd>{fieldStats.inventoryCount}</dd>
            </div>
            <div>
              <dt>Codex</dt>
              <dd>{fieldStats.codexFinds}</dd>
            </div>
            <div>
              <dt>Sites</dt>
              <dd>{fieldStats.sitesExplored}</dd>
            </div>
            <div>
              <dt>Leagues today</dt>
              <dd>{fieldStats.leaguesToday}</dd>
            </div>
          </dl>

          {albumNudge && (
            <p className="rpg-traveler-card__nudge rpg-traveler-card__nudge--amber">
              One find from completing {albumNudge.setName} (
              {albumNudge.discovered}/{albumNudge.total})
            </p>
          )}

          {activePerks.length > 0 && (
            <section className="rpg-traveler-card__section">
              <h3>Active field perks</h3>
              <ul>
                {activePerks.map((perk) => (
                  <li key={perk.perkName}>
                    {perk.perkName}
                    <span>{perk.chargesRemaining} left</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rpg-traveler-card__section">
            <h3>Sanctum loadout</h3>
            <p className="rpg-traveler-card__hint">
              UE5 gear slots — populate from your Unreal sanctum import.
            </p>
            <ul className="rpg-traveler-card__gear">
              {sanctum.gearSlots.map((slot) => (
                <li key={slot.slotId}>
                  <span>{slot.label}</span>
                  <span>
                    {slot.itemName ?? (
                      <em className="text-slate-500">Awaiting sanctum sync</em>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rpg-traveler-card__section">
            <h3>Sanctum crafting</h3>
            <p className="rpg-traveler-card__hint">
              Recipes you are close to crafting back in the UE5 game.
            </p>
            {sanctum.craftingNudges.length === 0 ? (
              <p className="rpg-traveler-card__empty">
                Explore more sites to gather sanctum materials.
              </p>
            ) : (
              <ul className="rpg-traveler-card__crafting">
                {sanctum.craftingNudges.map((nudge) => (
                  <li key={nudge.recipeId}>
                    <div>
                      <p className="font-medium text-slate-100">{nudge.outputName}</p>
                      <p className="text-[11px] text-slate-500">{nudge.recipeName}</p>
                    </div>
                    <p
                      className={
                        nudge.readyInSanctum
                          ? "rpg-traveler-card__craft-ready"
                          : "rpg-traveler-card__craft-missing"
                      }
                    >
                      {nudge.readyInSanctum
                        ? "Ready in sanctum"
                        : formatMissingNudge(nudge.missing)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>,
        document.body
      )}
    </>
  );
}
