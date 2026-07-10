import ItemIcon from "@/components/ItemIcon";
import { getCatalogEntry, getItemSet } from "@/lib/item-catalog";
import { catalogItemKey } from "@/lib/catalog-key";
import {
  ITEM_TYPE_LABEL,
  RARITY_CHIP,
  RARITY_LABEL,
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
  if (!encounter) return null;

  const newKeys = new Set(encounter.newCodexItemKeys ?? []);
  const hasNewDiscoveries = newKeys.size > 0;
  const completedSets = (encounter.completedSetIds ?? [])
    .map((id) => getItemSet(id))
    .filter((set): set is NonNullable<typeof set> => Boolean(set));
  const hasRareLoot = encounter.loot.some((item) => item.rarity === "rare");

  return (
    <div className="app-modal-overlay fixed inset-0 z-[2000] flex items-center justify-center bg-black/60">
      <div
        className={`rpg-panel w-full max-w-md border-amber-500/25 p-6 ${hasRareLoot ? "rpg-encounter--rare-pull" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="encounter-title"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/90">
          Encounter summary
        </p>
        <h2
          id="encounter-title"
          className="mt-1 text-xl font-bold text-slate-50"
        >
          {encounter.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {encounter.description}
        </p>

        {hasNewDiscoveries && (
          <div className="mt-4 rounded-lg border border-sky-400/30 bg-sky-500/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-200">
              Catalogued!
            </p>
            <ul className="mt-2 space-y-2">
              {encounter.loot
                .filter((item) => newKeys.has(catalogItemKey(item)))
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
              {encounter.perkBonusXp
                ? ` (includes +${encounter.perkBonusXp} perk)`
                : ""}
              {encounter.setBonusXp
                ? ` · +${encounter.setBonusXp} set bonus`
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
                const isNew = newKeys.has(catalogItemKey(item));
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
                              <span className="rounded-full border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-100">
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
