import type { FieldReport, ItemRarity } from "@/lib/types";
import {
  formatBestFind,
  formatFieldReportStarted,
  formatPoiTypesList,
} from "@/lib/field-report";

interface FieldReportPanelProps {
  report: FieldReport;
  onReset: () => void;
  embedded?: boolean;
}

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: "text-slate-300",
  uncommon: "text-emerald-300",
  rare: "text-amber-300",
};

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-100">{value}</span>
    </div>
  );
}

export default function FieldReportPanel({
  report,
  onReset,
  embedded = false,
}: FieldReportPanelProps) {
  const bestFindText = formatBestFind(report.bestFind);
  const bestFindClass =
    report.bestFind?.rarity != null
      ? RARITY_COLORS[report.bestFind.rarity]
      : "text-slate-400";

  return (
    <section className={embedded ? "rpg-expedition-section" : "rpg-panel p-4"}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Field Report</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Current outing summary — resets when you start a new report.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 rounded-lg border border-teal-500/40 bg-teal-500/15 px-3 py-1.5 text-xs font-medium text-teal-200 hover:bg-teal-500/25"
        >
          New outing
        </button>
      </div>

      <dl className="mt-3 space-y-2">
        <StatRow
          label="Started"
          value={formatFieldReportStarted(report.startedAt)}
        />
        <StatRow
          label="Sites explored"
          value={String(report.sitesExplored)}
        />
        <StatRow label="XP gained" value={String(report.xpGained)} />
        <StatRow label="Items found" value={String(report.itemsFound)} />
        <div className="flex items-start justify-between gap-3 text-sm">
          <span className="text-slate-500">Best find</span>
          <span className={`text-right font-medium ${bestFindClass}`}>
            {bestFindText}
          </span>
        </div>
        <StatRow
          label="POI types"
          value={formatPoiTypesList(report.poiTypesExplored)}
        />
        <StatRow
          label="Tasks completed"
          value={String(report.tasksCompleted)}
        />
      </dl>
    </section>
  );
}
