import { formatDistance } from "@/lib/distance";
import { getPoiTypeLabel } from "@/lib/poi-flavor";
import { getPoiGlyphClassName, POI_TYPE_CHIP_BG } from "@/lib/poi-visual";
import { getApproachReadout } from "@/lib/approach";
import { EXPLORE_RADIUS_METERS, type POI, type Position } from "@/lib/types";
import SiteApproachHUD from "@/components/SiteApproachHUD";

interface POIPanelProps {
  poi: POI | null;
  playerPosition: Position;
  visited: boolean;
  onExplore: () => void;
  onSimulateVisit?: () => void;
}

export default function POIPanel({
  poi,
  playerPosition,
  visited,
  onExplore,
  onSimulateVisit,
}: POIPanelProps) {
  if (!poi) {
    return (
      <div className="rpg-panel border-dashed border-slate-600/50 p-4 text-sm text-slate-400">
        <p className="text-slate-300">Scan the overworld map for nearby sites.</p>
        <p className="mt-2 text-xs text-slate-500">
          Tap a marker to inspect a point of interest. Sites stay stable within
          ~400 m of your path.
        </p>
      </div>
    );
  }

  const readout = getApproachReadout(playerPosition, poi, EXPLORE_RADIUS_METERS);
  const inRange = readout.status === "in_range";
  const typeChip = POI_TYPE_CHIP_BG[poi.type];
  const canSimulateVisit = Boolean(onSimulateVisit);

  return (
    <div className="rpg-panel overflow-hidden p-0">
      <div className="border-l-4 border-amber-400/80 bg-slate-900/40 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 gap-3">
            <div
              className={getPoiGlyphClassName(poi.type)}
              aria-hidden="true"
            >
              <div className="poi-marker-glyph" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/80">
                  {visited ? "Discovered site" : "Tracking site"}
                </p>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeChip}`}
                >
                  {getPoiTypeLabel(poi.type)}
                </span>
              </div>
              <h2 className="mt-1 text-lg font-bold text-slate-50">{poi.name}</h2>
              <p className="mt-2 rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-sm italic leading-relaxed text-slate-400">
                {poi.flavor}
              </p>
            </div>
          </div>
          {visited && (
            <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
              Visited
            </span>
          )}
        </div>

        <SiteApproachHUD poi={poi} playerPosition={playerPosition} />

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExplore}
            disabled={visited || !inRange}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              visited
                ? "cursor-not-allowed bg-slate-700 text-slate-500"
                : inRange
                  ? "bg-violet-600 text-white shadow-[0_0_16px_rgba(124,58,237,0.35)] hover:bg-violet-500"
                  : "cursor-not-allowed border border-slate-600 bg-slate-800/90 text-slate-400"
            }`}
          >
            {visited
              ? "Already explored"
              : inRange
                ? "Explore"
                : `Out of range (${formatDistance(readout.distanceMeters)})`}
          </button>
          {canSimulateVisit && (
            <button
              type="button"
              onClick={onSimulateVisit}
              disabled={visited}
              className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Simulate visit
            </button>
          )}
        </div>
        {!visited && !inRange && (
          <p className="mt-2 text-xs text-slate-500">
            Move within {EXPLORE_RADIUS_METERS} m to unlock Explore
            {canSimulateVisit ? ", or use Simulate visit for testing." : "."}
          </p>
        )}
      </div>
    </div>
  );
}
