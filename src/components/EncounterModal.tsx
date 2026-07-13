import { useEffect, useRef } from "react";
import ItemIcon from "@/components/ItemIcon";
import type { PendingEncounter } from "@/lib/encounter";
import { getCatalogEntry, getItemSet } from "@/lib/item-catalog";
import {
  ITEM_TYPE_LABEL,
  RARITY_CHIP,
  RARITY_LABEL,
  itemCatalogKey,
  lootRevealClass,
} from "@/lib/item-visual";
import type { EncounterApproachId, EncounterResult } from "@/lib/types";

interface EncounterModalProps {
  pendingEncounter: PendingEncounter | null;
  encounter: EncounterResult | null;
  onChoose: (approachId: EncounterApproachId) => void;
  onCancel: () => void;
  onClose: () => void;
}

export default function EncounterModal({
  pendingEncounter,
  encounter,
  onChoose,
  onCancel,
  onClose,
}: EncounterModalProps) {
  if (pendingEncounter) {
    return (
      <EncounterChoiceView
        pendingEncounter={pendingEncounter}
        onChoose={onChoose}
        onCancel={onCancel}
      />
    );
  }

  if (!encounter) return null;

  const newKeys = new Set(encounter.newCodexItemKeys ?? []);
  const hasNewDiscoveries = newKeys.size > 0;
  const completedSets = (encounter.completedSetIds ?? [])
    .map((id) => getItemSet(id))
    .filter((set): set is NonNullable<typeof set> => Boolean(set));
  const hasRareLoot = encounter.loot.some((item) => item.rarity === "rare");

  return (
    <div className="app-modal-overlay fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-3">
      <div
        className={`rpg-panel max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto border-amber-500/25 p-6 ${hasRareLoot ? "rpg-encounter--rare-pull" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="encounter-title"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/90">
          Field report
        </p>
        <h2
          id="encounter-title"
          className="mt-1 text-xl font-bold text-slate-50"
        >
          {encounter.title}
        </h2>
        {encounter.approachLabel && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-violet-400/35 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-100">
              Approach · {encounter.approachLabel}
            </span>
            <span className="text-xs text-slate-500">
              {encounter.approachOutcome === "payoff"
                ? "The gamble paid off"
                : encounter.approachOutcome === "setback"
                  ? "The gamble came up thin"
                  : "A steady result"}
            </span>
          </div>
        )}
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {encounter.description}
        </p>

        {hasNewDiscoveries && (
          <div className="rpg-discovery-panel mt-4 rounded-lg border border-sky-400/30 bg-sky-500/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-200">
              Catalogued!
            </p>
            <ul className="mt-2 space-y-2">
              {encounter.loot
                .filter((item) => newKeys.has(itemCatalogKey(item)))
                .map((item) => {
                  const entry = getCatalogEntry(item);
                  return (
                    <li
                      key={item.id}
                      className="flex items-start gap-2 text-sm text-sky-50"
                    >
                      <ItemIcon type={item.type} rarity={item.rarity} />
                      <div>
                        <span className="font-medium">{item.name}</span>
                        {entry && (
                          <p className="mt-0.5 text-xs leading-relaxed text-sky-100/75">
                            {entry.description}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}

        {completedSets.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-500/35 bg-amber-500/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200">
              Album set complete
            </p>
            <ul className="mt-2 space-y-1 text-sm text-amber-50">
              {completedSets.map((set) => (
                <li key={set.id}>
                  {set.name}{" "}
                  <span className="text-amber-200/80">(+{set.rewardXp} XP)</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 rounded-lg border border-slate-700/70 bg-slate-950/50 p-3">
          <div className="rpg-xp-flash">
            <p className="text-sm font-semibold text-amber-300">
              +{encounter.xpGained} XP
              {encounter.setBonusXp
                ? ` · +${encounter.setBonusXp} set bonus`
                : ""}
              {encounter.perkBonusXp
                ? ` · +${encounter.perkBonusXp} perk bonus`
                : ""}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-500 via-violet-500 to-amber-400" />
            </div>
          </div>

          {encounter.perkMessages && encounter.perkMessages.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-violet-200">
              {encounter.perkMessages.map((message) => (
                <li key={message}>⚡ {message}</li>
              ))}
            </ul>
          )}

          {encounter.loot.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {encounter.loot.map((item, index) => {
                const isNew = newKeys.has(itemCatalogKey(item));
                const revealClass = lootRevealClass(item.rarity);
                return (
                  <li
                    key={item.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${RARITY_CHIP[item.rarity]} ${revealClass}`}
                    style={
                      revealClass
                        ? { animationDelay: `${index * 120}ms` }
                        : undefined
                    }
                  >
                    <div className="flex items-start gap-2">
                      <ItemIcon type={item.type} rarity={item.rarity} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">{item.name}</p>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {isNew && (
                              <span className="rpg-discovery-glow rounded-full border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-100">
                                New
                              </span>
                            )}
                            <span className="text-xs uppercase tracking-wide">
                              {RARITY_LABEL[item.rarity]}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] uppercase tracking-wide opacity-75">
                          {ITEM_TYPE_LABEL[item.type]}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Your pack is unchanged this time.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_0_16px_rgba(124,58,237,0.3)] hover:bg-violet-500"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function EncounterChoiceView({
  pendingEncounter,
  onChoose,
  onCancel,
}: {
  pendingEncounter: PendingEncounter;
  onChoose: (approachId: EncounterApproachId) => void;
  onCancel: () => void;
}) {
  const firstChoiceRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    firstChoiceRef.current?.focus();
  }, [pendingEncounter.poi.id]);

  return (
    <div className="app-modal-overlay fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-3">
      <div
        className="rpg-panel max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto border-violet-400/30 p-5 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="encounter-choice-title"
        aria-describedby="encounter-choice-description"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/90">
          A decision at the site
        </p>
        <h2
          id="encounter-choice-title"
          className="mt-1 text-xl font-bold text-slate-50"
        >
          {pendingEncounter.poi.name}
        </h2>
        <p
          id="encounter-choice-description"
          className="mt-2 text-sm italic leading-relaxed text-slate-400"
        >
          {pendingEncounter.poi.flavor}
        </p>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
          Choose your approach
        </p>
        <div
          className="mt-2 grid gap-3"
          role="group"
          aria-label="Site approaches"
        >
          {pendingEncounter.approaches.map((approach, index) => {
            const safe = approach.tone === "safe";
            return (
              <button
                key={approach.id}
                ref={index === 0 ? firstChoiceRef : undefined}
                type="button"
                onClick={() => onChoose(approach.id)}
                className={`rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                  safe
                    ? "border-sky-400/35 bg-sky-500/10 hover:border-sky-300/60 hover:bg-sky-500/15 focus-visible:ring-sky-300"
                    : "border-amber-400/40 bg-amber-500/10 hover:border-amber-300/65 hover:bg-amber-500/15 focus-visible:ring-amber-300"
                }`}
                aria-label={`${approach.label}. ${approach.tradeoff}`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                    safe ? "text-sky-200" : "text-amber-200"
                  }`}
                >
                  {approach.kicker}
                </span>
                <span className="mt-1 block text-base font-semibold text-slate-50">
                  {approach.label}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-slate-300/80">
                  {approach.description}
                </span>
                <span
                  className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    safe
                      ? "border-sky-400/30 bg-sky-500/10 text-sky-100"
                      : "border-amber-400/30 bg-amber-500/10 text-amber-100"
                  }`}
                >
                  {approach.tradeoff}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          The site and your choice lock the outcome. Backing out does not spend
          the site or consume a Camp perk.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800"
        >
          Back to map
        </button>
      </div>
    </div>
  );
}
