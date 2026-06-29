import {
  APPROACH_BEARING_HIDE_METERS,
  getApproachLabel,
  getApproachProgress,
  getApproachStatus,
  type ApproachStatus,
} from "@/lib/approach";
import {
  bearingDegrees,
  bearingToCompass,
  distanceMeters,
  formatDistance,
} from "@/lib/distance";
import { EXPLORE_RADIUS_METERS, type POI, type Position } from "@/lib/types";

interface ApproachReadoutProps {
  poi: POI;
  playerPosition: Position;
}

const STATUS_CHIP: Record<ApproachStatus, string> = {
  in_range: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  nearby: "border-amber-500/40 bg-amber-500/15 text-amber-200",
  out_of_range: "border-slate-600/60 bg-slate-800/80 text-slate-300",
};

const STATUS_BAR: Record<ApproachStatus, string> = {
  in_range: "bg-emerald-500",
  nearby: "bg-gradient-to-r from-amber-500 to-violet-500",
  out_of_range: "bg-gradient-to-r from-violet-600 to-amber-500",
};

export default function ApproachReadout({
  poi,
  playerPosition,
}: ApproachReadoutProps) {
  const distMeters = distanceMeters(playerPosition, poi);
  const status = getApproachStatus(distMeters);
  const progress = getApproachProgress(distMeters);
  const percent = Math.round(progress * 100);
  const showBearing = distMeters >= APPROACH_BEARING_HIDE_METERS;
  const bearing = bearingDegrees(playerPosition, poi);
  const compass = bearingToCompass(bearing);

  return (
    <div
      className="mt-3 rounded-lg border border-slate-700/60 bg-slate-950/50 px-3 py-2.5"
      role="status"
      aria-live="polite"
      aria-label={`Approach: ${getApproachLabel(status)}, ${formatDistance(distMeters)} away`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
            Approach
          </p>
          <span
            className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CHIP[status]}`}
          >
            {getApproachLabel(status)}
          </span>
        </div>
        {showBearing ? (
          <div className="flex items-center gap-1.5 text-right">
            <span
              className="inline-block text-lg leading-none text-amber-300"
              style={{ transform: `rotate(${bearing}deg)` }}
              aria-hidden="true"
            >
              ↑
            </span>
            <span className="text-xs text-slate-400">
              Site lies <span className="font-medium text-slate-200">{compass}</span>
            </span>
          </div>
        ) : (
          <span className="text-xs font-medium text-emerald-300">Arrived</span>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-200">{formatDistance(distMeters)}</span>
        {" away · "}
        <span className="text-slate-500">{EXPLORE_RADIUS_METERS} m range</span>
      </p>

      <div className="mt-2">
        <div className="mb-1 flex justify-between text-[10px] text-slate-500">
          <span>Scanner lock</span>
          <span>{percent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full border border-slate-700/60 bg-slate-900">
          <div
            className={`h-full rounded-full transition-all duration-300 ${STATUS_BAR[status]}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {status !== "in_range" && (
        <p className="mt-2 text-[11px] text-slate-500">
          Move closer to enable Explore.
        </p>
      )}
      {status === "in_range" && (
        <p className="mt-2 text-[11px] text-emerald-300/90">
          Scanner in range — Explore is ready.
        </p>
      )}
    </div>
  );
}
