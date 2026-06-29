import type { EncounterResult, ItemRarity } from "@/lib/types";

interface EncounterModalProps {
  encounter: EncounterResult | null;
  onClose: () => void;
}

const RARITY_STYLES: Record<
  ItemRarity,
  { chip: string; label: string }
> = {
  common: {
    chip: "border-slate-500/40 bg-slate-700/50 text-slate-200",
    label: "Common",
  },
  uncommon: {
    chip: "border-emerald-500/40 bg-emerald-900/40 text-emerald-200",
    label: "Uncommon",
  },
  rare: {
    chip: "border-amber-500/50 bg-amber-900/40 text-amber-200",
    label: "Rare",
  },
};

export default function EncounterModal({
  encounter,
  onClose,
}: EncounterModalProps) {
  if (!encounter) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4">
      <div
        className="rpg-panel w-full max-w-md border-amber-500/25 p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="encounter-title"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/90">
          Encounter resolved
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
                const style = RARITY_STYLES[item.rarity];
                return (
                  <li
                    key={item.id}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${style.chip}`}
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs uppercase tracking-wide">
                      {style.label}
                    </span>
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
