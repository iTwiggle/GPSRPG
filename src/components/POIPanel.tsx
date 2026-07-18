import {
  APPROACH_STATUS_LABEL,
  findNearestPoi,
  getApproachReadout,
} from "@/lib/approach";
import {
  bearingArrowGlyph,
  bearingDegrees,
  formatCardinalBearing,
  formatDistance,
} from "@/lib/distance";
import type { OsmContextCategory } from "@/lib/osm-context";
import { POI_ANCHOR_REGENERATE_METERS } from "@/lib/poi-anchor";
import {
  getPoiDisplayFlavor,
  getPoiDisplayName,
  getPoiDisplayTypeLabel,
} from "@/lib/poi-reveal";
import { getPoiGlyphClassName, POI_TYPE_CHIP_BG } from "@/lib/poi-visual";
import { EXPLORE_RADIUS_METERS, type POI, type Position } from "@/lib/types";
import SiteApproachHUD from "@/components/SiteApproachHUD";

interface POIPanelProps {
  poi: POI | null;
  pois: POI[];
  playerPosition: Position;
  visited: boolean;
  areaContext?: OsmContextCategory;
  placeName?: string | null;
  onExplore: () => void;
  onSelectPoi?: (poi: POI) => void;
  onSimulateVisit?: () => void;
}

export default function POIPanel({
  poi,
  pois,
  playerPosition,
  visited,
  areaContext = "generic",
  placeName = null,
  onExplore,
  onSelectPoi,
  onSimulateVisit,
}: POIPanelProps) {
  if (!poi) {
    return (
      <NearestPoiEmptyState
        pois={pois}
        playerPosition={playerPosition}
        areaContext={areaContext}
        placeName={placeName}
        onSelectPoi={onSelectPoi}
      />
    );
  }

  const readout = getApproachReadout(playerPosition, poi, EXPLORE_RADIUS_METERS);
  const inRange = readout.status === "in_range";
  const typeChip = POI_TYPE_CHIP_BG[poi.type];
  const canSimulateVisit = Boolean(onSimulateVisit);
  const revealed = visited;
  const displayName = getPoiDisplayName(poi, revealed, areaContext);
  const displayFlavor = getPoiDisplayFlavor(poi, revealed);
  const displayType = getPoiDisplayTypeLabel(poi, revealed);

  return (
    <div className="rpg-panel overflow-hidden p-0">
      <div className="border-l-4 border-amber-400/80 bg-slate-900/40 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 gap-3">
            <div
              className={`${getPoiGlyphClassName(poi.type)}${
                revealed ? "" : " poi-marker--veiled"
              }`}
              aria-hidden="true"
            >
              <div className="poi-marker-glyph" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/80">
                  {revealed ? "Discovered site" : "Veiled site"}
                </p>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    revealed
                      ? typeChip
                      : "border-slate-500/50 bg-slate-800/70 text-slate-300"
                  }`}
                >
                  {displayType}
                </span>
              </div>
              <h2 className="mt-1 text-lg font-bold text-slate-50">
                {displayName}
              </h2>
              {placeName && (
                <p className="mt-1 text-xs text-violet-300/90">
                  Field of{" "}
                  <span className="font-medium text-violet-200">{placeName}</span>
                </p>
              )}
              <p
                className={`mt-2 rounded-lg border px-3 py-2 text-sm italic leading-relaxed ${
                  revealed
                    ? "border-slate-700/60 bg-slate-950/40 text-slate-400"
                    : "border-violet-500/25 bg-violet-950/30 text-violet-200/75"
                }`}
              >
                {displayFlavor}
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
                ? "Explore — reveal site"
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
        {!visited && inRange && (
          <p className="mt-2 text-xs text-violet-300/70">
            Exploring unveils this site&apos;s true name and nature.
          </p>
        )}
      </div>
    </div>
  );
}

function NearestPoiEmptyState({
  pois,
  playerPosition,
  areaContext,
  placeName,
  onSelectPoi,
}: {
  pois: POI[];
  playerPosition: Position;
  areaContext: OsmContextCategory;
  placeName: string | null;
  onSelectPoi?: (poi: POI) => void;
}) {
  const nearest = findNearestPoi(playerPosition, pois);

  if (!nearest) {
    return (
      <div className="rpg-panel border-dashed border-slate-600/50 p-4 text-sm text-slate-400">
        <p className="text-slate-300">Scan the overworld map for nearby sites.</p>
        <p className="mt-2 text-xs text-slate-500">
          Tap a marker to inspect a veiled aura. Sites stay stable until you walk
          ~{POI_ANCHOR_REGENERATE_METERS} m from the field anchor.
        </p>
        {placeName && (
          <p className="mt-2 text-xs text-violet-300/80">
            Scanning the field of {placeName}…
          </p>
        )}
      </div>
    );
  }

  const readout = getApproachReadout(
    playerPosition,
    nearest,
    EXPLORE_RADIUS_METERS
  );
  const bearing = bearingDegrees(playerPosition, nearest);
  const direction = formatCardinalBearing(bearing);
  const arrow = bearingArrowGlyph(bearing);
  const statusLabel = APPROACH_STATUS_LABEL[readout.status];
  const canTrack = Boolean(onSelectPoi);
  const displayName = getPoiDisplayName(nearest, false, areaContext);

  return (
    <div className="rpg-panel border-dashed border-slate-600/50 p-4 text-sm text-slate-400">
      <p className="text-slate-300">Scan the overworld map for nearby sites.</p>
      <p className="mt-2 text-xs text-slate-500">
        Tap a marker to inspect a veiled aura, or track the nearest site below.
        Sites refresh after ~{POI_ANCHOR_REGENERATE_METERS} m from anchor.
      </p>
      {placeName && (
        <p className="mt-2 text-xs text-violet-300/80">
          Field of <span className="font-medium text-violet-200">{placeName}</span>
        </p>
      )}

      <div className="mt-4 rounded-lg border border-violet-500/25 bg-slate-950/45 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/85">
              Nearest veiled site
            </p>
            <p className="mt-1 font-medium text-slate-100">{displayName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex rounded-full border border-slate-500/50 bg-slate-800/70 px-2 py-0.5 font-semibold uppercase tracking-wide text-slate-300">
                Unknown aura
              </span>
              <span className="text-slate-400">
                {formatDistance(readout.distanceMeters)} · {direction} {arrow}
              </span>
              <span className="rounded-full border border-slate-600/70 bg-slate-900/80 px-2 py-0.5 font-medium text-slate-300">
                {statusLabel}
              </span>
            </div>
          </div>
          <div
            className={`${getPoiGlyphClassName(nearest.type)} poi-marker--veiled shrink-0`}
            aria-hidden="true"
          >
            <div className="poi-marker-glyph" />
          </div>
        </div>

        {canTrack && (
          <button
            type="button"
            onClick={() => onSelectPoi?.(nearest)}
            className="mt-3 w-full rounded-lg border border-violet-500/35 bg-violet-600/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-violet-100 transition hover:bg-violet-600/25"
          >
            Track nearest site
          </button>
        )}
      </div>
    </div>
  );
}
