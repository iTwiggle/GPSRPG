import type { FieldTask } from "@/lib/types";

interface FieldTasksPanelProps {
  tasks: FieldTask[];
  onRefresh?: () => void;
  refreshDisabled?: boolean;
  refreshHint?: string;
  embedded?: boolean;
}

function progressPercent(task: FieldTask): number {
  if (task.target <= 0) return 100;
  return Math.min(100, Math.round((task.progress / task.target) * 100));
}

export default function FieldTasksPanel({
  tasks,
  onRefresh,
  refreshDisabled = false,
  refreshHint,
  embedded = false,
}: FieldTasksPanelProps) {
  const activeCount = tasks.filter((task) => task.status === "active").length;
  const completedCount = tasks.length - activeCount;

  return (
    <section className={embedded ? "rpg-expedition-section" : "rpg-panel p-4"}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Field Contracts</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Short-term goals for this outing — progress updates when you explore
            sites.
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
            {activeCount} active
            {completedCount > 0 ? ` · ${completedCount} fulfilled` : ""}
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshDisabled}
            className="shrink-0 rounded-lg border border-violet-500/40 bg-violet-500/15 px-3 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            New Contracts
          </button>
        )}
      </div>
      {refreshHint && (
        <p className="mt-2 text-[11px] text-slate-500">{refreshHint}</p>
      )}

      <ul className="mt-3 space-y-2" aria-live="polite" aria-relevant="additions">
        {tasks.map((task) => {
          const isCompleted = task.status === "completed";
          const percent = progressPercent(task);

          return (
            <li
              key={task.id}
              className={`rounded-lg border px-3 py-2.5 ${
                isCompleted
                  ? "border-emerald-500/35 bg-emerald-500/10"
                  : "border-slate-700/60 bg-slate-900/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      isCompleted ? "text-emerald-200" : "text-slate-100"
                    }`}
                  >
                    {task.title.replace(/^Field Contract: /, "")}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{task.description}</p>
                </div>
                {isCompleted ? (
                  <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                    Fulfilled
                  </span>
                ) : (
                  <span className="shrink-0 text-xs font-medium text-amber-300">
                    +{task.rewardXp} XP
                  </span>
                )}
              </div>

              <div className="mt-2">
                <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                  <span>
                    {task.progress} / {task.target}
                  </span>
                  <span>{percent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full border border-slate-700/60 bg-slate-950">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCompleted
                        ? "bg-emerald-500"
                        : "bg-gradient-to-r from-violet-600 to-amber-500"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
