import type { Codex, ItemRarity } from "@/lib/types";

interface CodexPanelProps {
  codex: Codex;
}

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: "text-slate-300",
  uncommon: "text-emerald-300",
  rare: "text-amber-300",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function sortByLast<T extends { lastAt?: string; lastFoundAt?: string; lastVisitedAt?: string }>(
  entries: T[],
  key: "lastAt" | "lastFoundAt" | "lastVisitedAt"
): T[] {
  return [...entries].sort(
    (a, b) => new Date(b[key]!).getTime() - new Date(a[key]!).getTime()
  );
}

export default function CodexPanel({ codex }: CodexPanelProps) {
  const { stats } = codex;
  const items = sortByLast(Object.values(codex.items), "lastFoundAt");
  const pois = sortByLast(Object.values(codex.pois), "lastVisitedAt");
  const encounters = sortByLast(Object.values(codex.encounters), "lastAt");
  const isEmpty =
    stats.totalExplores === 0 &&
    items.length === 0 &&
    pois.length === 0 &&
    encounters.length === 0;

  return (
    <div className="rpg-panel p-4">
      <h2 className="text-sm font-semibold text-slate-100">Collection Log</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Your discovery history — POIs, loot, and encounters.
      </p>

      {isEmpty ? (
        <p className="mt-3 text-sm text-slate-500">No discoveries yet.</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatChip label="Explores" value={stats.totalExplores} />
            <StatChip label="POIs" value={stats.totalVisitedPois} />
            <StatChip label="Items" value={stats.totalItemsFound} />
            <StatChip
              label="Rare"
              value={stats.rarityCounts.rare}
              className="text-amber-300"
            />
            <StatChip
              label="Uncommon"
              value={stats.rarityCounts.uncommon}
              className="text-emerald-300"
            />
          </div>

          <CodexSection title="Items found">
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">No items logged yet.</p>
            ) : (
              <ul className="max-h-36 space-y-2 overflow-y-auto">
                {items.map((item) => (
                  <li
                    key={`${item.name}|${item.type}`}
                    className="flex items-start justify-between gap-2 rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-200">
                        {item.name}
                        {item.countFound > 1 && (
                          <span className="ml-1 text-slate-500">
                            ×{item.countFound}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        First {formatDate(item.firstFoundAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 capitalize ${RARITY_COLORS[item.rarity]}`}
                    >
                      {item.rarity} {item.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CodexSection>

          <CodexSection title="POIs visited">
            {pois.length === 0 ? (
              <p className="text-sm text-slate-500">No POIs logged yet.</p>
            ) : (
              <ul className="max-h-36 space-y-2 overflow-y-auto">
                {pois.map((poi) => (
                  <li
                    key={poi.poiId}
                    className="flex items-start justify-between gap-2 rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-200">
                        {poi.name}
                        {poi.visitCount > 1 && (
                          <span className="ml-1 text-slate-500">
                            ×{poi.visitCount}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        First {formatDate(poi.firstVisitedAt)}
                      </p>
                    </div>
                    <span className="shrink-0 capitalize text-slate-400">
                      {poi.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CodexSection>

          <CodexSection title="Encounters">
            {encounters.length === 0 ? (
              <p className="text-sm text-slate-500">No encounters yet.</p>
            ) : (
              <ul className="max-h-36 space-y-2 overflow-y-auto">
                {encounters.map((entry) => (
                  <li
                    key={entry.title}
                    className="flex items-start justify-between gap-2 rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-200">
                        {entry.title}
                        {entry.count > 1 && (
                          <span className="ml-1 text-slate-500">
                            ×{entry.count}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        First {formatDate(entry.firstAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CodexSection>
        </>
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  className = "text-slate-200",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <span className="rounded-full border border-slate-700/50 bg-slate-900/60 px-2.5 py-1 text-xs font-medium">
      <span className="text-slate-500">{label}</span>{" "}
      <span className={className}>{value}</span>
    </span>
  );
}

function CodexSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}
