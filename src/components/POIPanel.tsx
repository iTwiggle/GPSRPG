import { distanceMeters, formatDistance, isWithinRadius } from "@/lib/distance";
import { getPoiTypeLabel } from "@/lib/poi-flavor";
import { getPoiGlyphClassName, POI_TYPE_CHIP_BG } from "@/lib/poi-visual";
import { EXPLORE_RADIUS_METERS, type POI, type Position } from "@/lib/types";
import ApproachReadout from "@/components/ApproachReadout";

interface POIPanelProps {
  poi: POI | null;
  playerPosition: Position;
  visited: boolean;
  onExplore: () => void;
  onSimulateVisit: () => void;
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

  const dist = distanceMeters(playerPosition, poi);
  const inRange = isWithinRadius(
    playerPosition,
    poi,
    EXPLORE_RADIUS_METERS
  );
  const typeChip = POI_TYPE_CHIP_BG[poi.type];

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
                  {visited ? "Discovered site" : "Nearby site"}
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

        <ApproachReadout poi={poi} playerPosition={playerPosition} />

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExplore}
            disabled={visited || !inRange}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-[0_0_16px_rgba(124,58,237,0.35)] transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:border disabled:border-slate-600 disabled:bg-slate-800/90 disabled:text-slate-400 disabled:shadow-none"
          >
            {visited
              ? "Already explored"
              : inRange
                ? "Explore"
                : `Move closer — ${formatDistance(dist)} away`}
          </button>
          <button
            type="button"
            onClick={onSimulateVisit}
            disabled={visited}
            className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Simulate visit
          </button>
        </div>
      </div>
    </div>
  );
}
