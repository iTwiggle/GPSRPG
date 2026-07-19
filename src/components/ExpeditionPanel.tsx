import ActivityLogPanel from "@/components/ActivityLogPanel";
import FieldReportPanel from "@/components/FieldReportPanel";
import FieldTasksPanel from "@/components/FieldTasksPanel";
import { getExpeditionProgress } from "@/lib/expedition";
import { formatDistance } from "@/lib/distance";
import type { TrailMomentumStatus } from "@/lib/movement/trail-momentum";
import type { ActivityEvent, FieldReport, FieldTask } from "@/lib/types";

interface ExpeditionPanelProps {
  tasks: FieldTask[];
  report: FieldReport;
  events: ActivityEvent[];
  onResetReport: () => void;
  onRefreshTasks?: () => void;
  contractRefreshDisabled?: boolean;
  contractRefreshHint?: string;
  trailMomentum: TrailMomentumStatus & { demoPreviewActive: boolean };
}

export default function ExpeditionPanel({
  tasks,
  report,
  events,
  onResetReport,
  onRefreshTasks,
  contractRefreshDisabled = false,
  contractRefreshHint,
  trailMomentum,
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

      <section className={`rpg-trail-momentum ${trailMomentum.scoutsEyeActive ? "rpg-trail-momentum--active" : ""}`} aria-labelledby="trail-momentum-title">
        <div className="rpg-trail-momentum__heading">
          <div>
            <p className="rpg-expedition__eyebrow">Daily movement boon</p>
            <h3 id="trail-momentum-title" className="rpg-trail-momentum__title">{trailMomentum.scoutsEyeActive ? "Scout's Eye active" : "Build Trail Momentum"}</h3>
          </div>
          <span className="rpg-trail-momentum__glyph" aria-hidden="true">◉</span>
        </div>
        <p className="rpg-trail-momentum__copy">
          {trailMomentum.demoPreviewActive
            ? "Demo preview: live sight reaches 20% farther. No movement progress was saved."
            : trailMomentum.scoutsEyeActive
              ? "+20% live sight until local midnight. Explore range remains 150 m."
              : `${formatDistance(trailMomentum.remainingMeters)} more validated walking unlocks +20% live sight for today.`}
        </p>
        <div className="rpg-trail-momentum__progress" role="progressbar" aria-label={`Daily Trail Momentum: ${trailMomentum.progressPercent}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={trailMomentum.progressPercent}>
          <div style={{ width: `${trailMomentum.progressPercent}%` }} />
        </div>
        <div className="rpg-trail-momentum__meta">
          <span>{formatDistance(Math.min(trailMomentum.distanceMeters, trailMomentum.targetMeters))} / {formatDistance(trailMomentum.targetMeters)}</span>
          <span>Live GPS only · no route history</span>
        </div>
        <div className="mt-4 border-t border-sky-400/15 pt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-sky-100">
              {trailMomentum.trailSurgeActive
                ? "Trail Surge active"
                : "Quick-foot challenge"}
            </p>
            <span className="text-[0.65rem] font-semibold text-sky-200/70">
              {trailMomentum.trailSurgeActive ? "+10% XP" : "800 m · 60 min"}
            </span>
          </div>
          <p className="rpg-trail-momentum__copy">
            {trailMomentum.trailSurgeActive
              ? "+10% encounter XP until local midnight."
              : `${formatDistance(trailMomentum.trailSurgeRemainingMeters)} more validated walking inside the current hour.`}
          </p>
          <div className="rpg-trail-momentum__progress" role="progressbar" aria-label={`Trail Surge: ${trailMomentum.trailSurgeProgressPercent}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={trailMomentum.trailSurgeProgressPercent}>
            <div style={{ width: `${trailMomentum.trailSurgeProgressPercent}%` }} />
          </div>
        </div>
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
