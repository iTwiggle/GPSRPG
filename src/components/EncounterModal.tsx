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

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="encounter-title"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
          Encounter
        </p>
        <h2 id="encounter-title" className="mt-1 text-xl font-bold text-slate-900">
          {encounter.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {encounter.description}
        </p>

        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
          <p className="font-medium text-slate-800">+{encounter.xpGained} XP</p>
          {encounter.loot.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {encounter.loot.map((item) => (
                <li key={item.id} className="text-slate-600">
                  Found: {item.name} ({item.rarity})
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-slate-500">No loot this time.</p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
