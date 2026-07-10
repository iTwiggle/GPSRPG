import L from "leaflet";
import {
  buildMarkerAccessibilityState,
  buildPoiMarkerAriaLabel,
  PLAYER_MARKER_ARIA_LABEL,
  type MarkerAccessibilityState,
  type PoiMarkerA11yInput,
} from "./marker-a11y";
import type { POI, POIType } from "./types";

interface PoiMarkerOptions {
  selected?: boolean;
  visited?: boolean;
  inRange?: boolean;
}

export interface MarkerConfig {
  icon: L.DivIcon;
  accessibility: MarkerAccessibilityState;
}

const MARKER_SIZE = 28;
const MARKER_ANCHOR = MARKER_SIZE / 2;

function buildPoiMarkerA11yInput(
  poi: Pick<POI, "name" | "type">,
  options: PoiMarkerOptions
): PoiMarkerA11yInput {
  const { selected = false, visited = false, inRange = false } = options;

  return {
    name: poi.name,
    type: poi.type,
    selected,
    visited,
    inRange: selected && inRange,
  };
}

export function createPoiMarkerIcon(
  type: POIType,
  options: PoiMarkerOptions = {}
): L.DivIcon {
  const { selected = false, visited = false, inRange = false } = options;
  const classes = [
    "poi-marker",
    `poi-marker--${type}`,
    selected ? "poi-marker--selected" : "",
    selected && inRange ? "poi-marker--in-range" : "",
    visited ? "poi-marker--visited" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return L.divIcon({
    className: classes,
    html: `<div class="poi-marker-glyph" aria-hidden="true"></div>`,
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_ANCHOR, MARKER_ANCHOR],
  });
}

export function createPoiMarkerConfig(
  poi: Pick<POI, "name" | "type">,
  options: PoiMarkerOptions = {}
): MarkerConfig {
  const a11yInput = buildPoiMarkerA11yInput(poi, options);

  return {
    icon: createPoiMarkerIcon(poi.type, options),
    accessibility: buildMarkerAccessibilityState(
      buildPoiMarkerAriaLabel(a11yInput)
    ),
  };
}

export const playerMarkerIcon = L.divIcon({
  className: "player-marker",
  html: '<div class="player-marker-glyph" aria-hidden="true"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const playerMarkerConfig: MarkerConfig = {
  icon: playerMarkerIcon,
  accessibility: buildMarkerAccessibilityState(PLAYER_MARKER_ARIA_LABEL),
};
