import L from "leaflet";
import type { POIType } from "./types";

interface PoiMarkerOptions {
  selected?: boolean;
  visited?: boolean;
  inRange?: boolean;
}

const MARKER_SIZE = 28;
const MARKER_ANCHOR = MARKER_SIZE / 2;

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

export const playerMarkerIcon = L.divIcon({
  className: "player-marker",
  html: '<div class="player-marker-glyph" aria-hidden="true"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});
