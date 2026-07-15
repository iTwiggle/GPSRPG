"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ItemIcon from "@/components/ItemIcon";
import { encounterReportDismissMs } from "@/lib/encounter-report";
import { getItemSet } from "@/lib/item-catalog";
import {
  ITEM_TYPE_LABEL,
  RARITY_CHIP,
  RARITY_LABEL,
  itemCatalogKey,
  lootRevealClass,
} from "@/lib/item-visual";
import type { EncounterResult } from "@/lib/types";

interface EncounterModalProps {
  encounter: EncounterResult | null;
  onClose: () => void;
}

export default function EncounterModal({
  encounter,
  onClose,
}: EncounterModalProps) {
  const [paused, setPaused] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const dismissMs = useMemo(
    () => (encounter ? encounterReportDismissMs(encounter) : null),
    [encounter]
  );

  useEffect(() => {
    setPaused(false);
  }, [encounter]);

  useEffect(() => {
    if (!encounter || dismissMs === null || paused) return;
    const timer = window.setTimeout(() => closeRef.current(), dismissMs);
    return () => window.clearTimeout(timer);
  }, [dismissMs, encounter, paused]);

  useEffect(() => {
    if (!encounter) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [encounter]);

  if (!encounter) return null;

  const newKeys = new Set(encounter.newCodexItemKeys ?? []);
  const completedSets = (encounter.completedSetIds ?? [])
    .map((id) => getItemSet(id))
    .filter((set): set is NonNullable<typeof set> => Boolean(set));
  const hasRareLoot = encounter.loot.some((item) => item.rarity === "rare");
  const staysOpen = dismissMs === null;

  return (
    <aside
      className="encounter-report-shell"
      aria-live="polite"
      aria-atomic="true"
    >
      <section
        className={`encounter-report rpg-panel ${
          hasRareLoot ? "rpg-encounter--rare-pull" : ""
        }`}
        role="status"
        aria-labelledby="encounter-title"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-300/90">
              {staysOpen ? "Notable field report" : "Field report"}
            </p>
            <h2
              id="encounter-title"
              className="mt-0.5 truncate text-sm font-bold text-slate-50"
            >
              {encounter.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="encounter-report-close"
            aria-label="Dismiss field report"
          >
            ×
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs">
          <strong className="shrink-0 text-amber-300">
            +{encounter.xpGained} XP
          </strong>
          {encounter.setBonusXp ? (
            <span className="text-amber-100/75">
              +{encounter.setBonusXp} set
            </span>
          ) : null}
          {encounter.perkBonusXp ? (
            <span className="text-violet-200/80">
              +{encounter.perkBonusXp} perk
            </span>
          ) : null}
          {encounter.loot.length === 0 ? (
            <span className="truncate text-slate-400">Pack unchanged</span>
          ) : null}
        </div>

        {encounter.loot.length > 0 && (
          <ul className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
            {encounter.loot.map((item, index) => {
              const isNew = newKeys.has(itemCatalogKey(item));
              const revealClass = lootRevealClass(item.rarity);
              return (
                <li
                  key={item.id}
                  className={`encounter-report-loot ${RARITY_CHIP[item.rarity]} ${revealClass}`}
                  style={
                    revealClass
                      ? { animationDelay: `${index * 120}ms` }
                      : undefined
                  }
                >
                  <ItemIcon type={item.type} rarity={item.rarity} />
                  <span className="min-w-0">
                    <span className="block max-w-32 truncate font-medium">
                      {item.name}
                    </span>
                    <span className="block text-[9px] uppercase tracking-wide opacity-70">
                      {isNew ? "New · " : ""}
                      {RARITY_LABEL[item.rarity]} {ITEM_TYPE_LABEL[item.type]}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {completedSets.length > 0 && (
          <p className="mt-2 text-[11px] font-medium text-amber-100">
            Set complete: {completedSets.map((set) => set.name).join(", ")}
          </p>
        )}

        {encounter.perkMessages && encounter.perkMessages.length > 0 && (
          <p className="mt-1 truncate text-[10px] text-violet-200">
            ⚡ {encounter.perkMessages.join(" · ")}
          </p>
        )}

        {!staysOpen && (
          <div
            className={`encounter-report-timer ${paused ? "is-paused" : ""}`}
            style={{ "--report-duration": `${dismissMs}ms` } as React.CSSProperties}
            aria-hidden="true"
          />
        )}
      </section>
    </aside>
  );
}
