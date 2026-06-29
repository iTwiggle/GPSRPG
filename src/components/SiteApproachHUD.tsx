import {
  APPROACH_STATUS_LABEL,
  getApproachReadout,
  type ApproachStatus,
} from "@/lib/approach";
import {
  bearingArrowGlyph,
  bearingDegrees,
  formatCardinalBearing,
  formatDistance,
} from "@/lib/distance";
import { EXPLORE_RADIUS_METERS, type POI, type Position } from "@/lib/types";

interface SiteApproachHUDProps {
  poi: POI;
  playerPosition: Position;
}

const STATUS_STYLES: Record<
  ApproachStatus,
  { badge: string; bar: string; glow: string }
> = {
  far: {
    badge: "border-slate-600/50 bg-slate-800/60 text-slate-300",
    bar: "bg-slate-500",
    glow: "shadow-none",
  },
  nearby: {
    badge: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    bar: "bg-amber-400",
    glow: "shadow-[0_0_12px_rgba(251,191,36,0.15)]",
  },
  in_range: {
    badge: "border-emerald-500/45 bg-emerald-500/15 text-emerald-200",
    bar: "bg-emerald-400",
    glow: "shadow-[0_0_16px_rgba(52,211,153,0.2)]",
  },
};

export default function SiteApproachHUD({
  poi,
  playerPosition,
}: SiteApproachHUDProps) {
  const readout = getApproachReadout(
    playerPosition,
    poi,
    EXPLORE_RADIUS_METERS
  );
  const bearing = bearingDegrees(playerPosition, poi);
  const directionLabel = formatCardinalBearing(bearing);
  const directionArrow = bearingArrowGlyph(bearing);
  const styles = STATUS_STYLES[readout.status];
  const progressPct = Math.round(readout.progress * 100);

  return (
    <div
      className={`mt-3 rounded-lg border border-slate-700/60 bg-slate-950/50 p-3 ${styles.glow}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rpg-aura-readout__label">Site approach</span>
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles.badge}`}
        >
          {APPROACH_STATUS_LABEL[readout.status]}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-mono text-sm font-semibold text-slate-100">
          {formatDistance(readout.distanceMeters)}{" "}
          <span className="font-normal text-slate-500">away</span>
        </p>
        <p className="text-xs text-slate-500">
          {readout.exploreRadiusMeters} m range
        </p>
      </div>

      <div className="mt-2">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Approach progress: ${progressPct}% toward exploration range`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${styles.bar}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-slate-500">
          {readout.status === "in_range"
            ? "Scanner locked — within exploration range"
            : `${progressPct}% toward range`}
        </p>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded border border-slate-700/80 bg-slate-900/80 font-mono text-base text-amber-200"
          aria-hidden="true"
        >
          {directionArrow}
        </span>
        <span>
          <span className="text-slate-500">Bearing</span>{" "}
          <span className="font-medium text-slate-200">{directionLabel}</span>
        </span>
      </div>
    </div>
  );
}
