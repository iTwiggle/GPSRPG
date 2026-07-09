import {
  ITEM_TYPE_LABEL,
  RARITY_CHIP,
  RARITY_LABEL,
  itemCatalogKey,
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

  return (
    <div className="app-modal-overlay fixed inset-0 z-[2000] flex items-center justify-center bg-black/60">
      <div
        className="rpg-panel w-full max-w-md border-amber-500/25 p-6"
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
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {encounter.description}
        </p>

        <div className="mt-4 rounded-lg border border-slate-700/70 bg-slate-950/50 p-3">
          <div className="rpg-xp-flash">
            <p className="text-sm font-semibold text-amber-300">
              +{encounter.xpGained} XP
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-500 via-violet-500 to-amber-400" />
            </div>
          </div>

          {encounter.loot.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {encounter.loot.map((item) => {
                const isNew = newKeys.has(itemCatalogKey(item));
                return (
                  <li
                    key={item.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${RARITY_CHIP[item.rarity]}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-[11px] uppercase tracking-wide opacity-75">
                          {ITEM_TYPE_LABEL[item.type]}
                        </p>
                      </div>
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
