import { distanceMeters, formatDistance, isWithinRadius } from "@/lib/distance";
import { getPoiTypeLabel } from "@/lib/poi-flavor";
import { EXPLORE_RADIUS_METERS, type POI, type Position } from "@/lib/types";

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
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/90 p-4 text-sm text-slate-500">
        <p>Tap a map marker to inspect a nearby point of interest.</p>
        <p className="mt-2 text-xs text-slate-400">
          Nearby POIs stay stable within ~400 m of your path.
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

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Point of Interest
          </p>
          <h2 className="text-lg font-bold text-slate-900">{poi.name}</h2>
          <p className="text-sm text-slate-600">{getPoiTypeLabel(poi.type)}</p>
          <p className="mt-1 text-sm italic text-slate-500">{poi.flavor}</p>
        </div>
        {visited && (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
            Visited
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-600">
        Distance: <span className="font-medium">{formatDistance(dist)}</span>
        {" · "}
        Explore radius: {EXPLORE_RADIUS_METERS} m
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onExplore}
          disabled={visited || !inRange}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {visited ? "Already explored" : inRange ? "Explore" : "Too far"}
        </button>
        <button
          type="button"
          onClick={onSimulateVisit}
          disabled={visited}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Simulate visit
        </button>
      </div>
    </div>
  );
}
