import ActivityLogPanel from "@/components/ActivityLogPanel";
import FieldReportPanel from "@/components/FieldReportPanel";
import FieldTasksPanel from "@/components/FieldTasksPanel";
import { getExpeditionProgress } from "@/lib/expedition";
import type { ActivityEvent, FieldReport, FieldTask } from "@/lib/types";

interface ExpeditionPanelProps {
  tasks: FieldTask[];
  report: FieldReport;
  events: ActivityEvent[];
  onResetReport: () => void;
  onRefreshTasks?: () => void;
  contractRefreshDisabled?: boolean;
  contractRefreshHint?: string;
}

export default function ExpeditionPanel({
  tasks,
  report,
  events,
  onResetReport,
  onRefreshTasks,
  contractRefreshDisabled = false,
  contractRefreshHint,
}: ExpeditionPanelProps) {
  const fulfilled = tasks.filter((task) => task.status === "completed").length;
  const active = tasks.length - fulfilled;
  const progress = getExpeditionProgress(tasks);
  const complete = tasks.length > 0 && active === 0;

  return (
    <div className="rpg-expedition">
      <section
        className="rpg-expedition__summary"
        aria-labelledby="expedition-status"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="rpg-expedition__eyebrow">Current expedition</p>
            <h3 id="expedition-status" className="rpg-expedition__title">
              {complete ? "Expedition complete" : "Field run in progress"}
            </h3>
            <p className="rpg-expedition__subtitle">
              {complete
                ? contractRefreshDisabled
                  ? "Every field contract is fulfilled. New contracts unlock tomorrow."
                  : "Every field contract is fulfilled. Roll new contracts when you are ready."
                : `${active} contract${active === 1 ? "" : "s"} still active · ${fulfilled} fulfilled`}
            </p>
          </div>
          <span
            className={`rpg-expedition__percent ${
              complete ? "rpg-expedition__percent--complete" : ""
            }`}
          >
            {progress}%
          </span>
        </div>

        <div
          className="rpg-expedition__progress"
          role="progressbar"
          aria-label={`Expedition contract progress: ${progress}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div style={{ width: `${progress}%` }} />
        </div>

        <dl className="rpg-expedition__stats">
          <div>
            <dt>Sites</dt>
            <dd>{report.sitesExplored}</dd>
          </div>
          <div>
            <dt>XP earned</dt>
            <dd>{report.xpGained}</dd>
          </div>
          <div>
            <dt>Finds</dt>
            <dd>{report.itemsFound}</dd>
          </div>
        </dl>
      </section>

      <FieldTasksPanel
        tasks={tasks}
        onRefresh={onRefreshTasks}
        refreshDisabled={contractRefreshDisabled}
        refreshHint={contractRefreshHint}
        embedded
      />
      <FieldReportPanel report={report} onReset={onResetReport} embedded />
      <ActivityLogPanel events={events} embedded />
    </div>
  );
}
