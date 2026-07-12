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
const PLAYER_MARKER_WIDTH = 44;
const PLAYER_MARKER_HEIGHT = 54;

const PLAYER_WAYFARER_HTML = `
  <div
    class="player-marker-glyph"
    aria-hidden="true"
    style="width:${PLAYER_MARKER_WIDTH}px;height:${PLAYER_MARKER_HEIGHT}px;border-radius:0;background:none;border:0;box-shadow:none;overflow:visible;"
  >
    <svg
      class="player-wayfarer-sprite"
      width="${PLAYER_MARKER_WIDTH}"
      height="${PLAYER_MARKER_HEIGHT}"
      viewBox="0 0 44 54"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
    >
      <style>
        .player-wayfarer-bob {
          animation: player-wayfarer-idle 1.8s ease-in-out infinite;
          transform-origin: 22px 46px;
        }
        .player-wayfarer-shadow {
          animation: player-wayfarer-shadow 1.8s ease-in-out infinite;
          transform-origin: 22px 48px;
        }
        @keyframes player-wayfarer-idle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.6px); }
        }
        @keyframes player-wayfarer-shadow {
          0%, 100% { transform: scaleX(1); opacity: .52; }
          50% { transform: scaleX(.86); opacity: .38; }
        }
        @media (prefers-reduced-motion: reduce) {
          .player-wayfarer-bob,
          .player-wayfarer-shadow { animation: none; }
        }
      </style>
      <ellipse
        class="player-wayfarer-shadow"
        cx="22"
        cy="48"
        rx="10"
        ry="3.2"
        fill="#020617"
        opacity=".52"
      />
      <g class="player-wayfarer-bob" stroke-linejoin="round" stroke-linecap="round">
        <path
          d="M17 23 10 31 11 43 18 47 22 41 26 47 34 43 34 31 28 23Z"
          fill="#34275a"
          stroke="#110d20"
          stroke-width="2"
        />
        <path
          d="M13 31 17 25 22 29 27 25 32 31 29 42 22 39 15 42Z"
          fill="#58428e"
          stroke="#171026"
          stroke-width="1.6"
        />
        <path d="M18 39 17 47 21 48 22 40Z" fill="#493523" stroke="#17100c" stroke-width="1.5" />
        <path d="M22 40 23 48 28 47 26 39Z" fill="#493523" stroke="#17100c" stroke-width="1.5" />
        <path d="M15 47 21 47 21 50 14 50Z" fill="#211a19" stroke="#0d0a0a" stroke-width="1.3" />
        <path d="M23 47 29 46 31 49 24 50Z" fill="#211a19" stroke="#0d0a0a" stroke-width="1.3" />
        <path d="M12 31 7 38 10 40 16 34Z" fill="#75583a" stroke="#1c130d" stroke-width="1.5" />
        <path d="M32 30 37 36 34 39 28 34Z" fill="#75583a" stroke="#1c130d" stroke-width="1.5" />
        <path d="M9 40 6 47" stroke="#8b6a3f" stroke-width="2.2" />
        <path d="M5 47 8 47 7 51Z" fill="#b89a5f" stroke="#2a1c0d" stroke-width="1" />
        <path d="M15 31 29 31" stroke="#d5ad52" stroke-width="2" />
        <rect x="20" y="29.5" width="4" height="3.2" rx=".8" fill="#f4cf68" stroke="#5c4315" stroke-width=".8" />
        <path
          d="M14 20C14 11 18 6 22 6S30 11 30 20L27 26H17Z"
          fill="#2d234d"
          stroke="#100c1d"
          stroke-width="2"
        />
        <path
          d="M17 17C18 12 20 10 22 10S26 12 27 17L25 22H19Z"
          fill="#bc8a61"
          stroke="#2c1a13"
          stroke-width="1.3"
        />
        <path d="M18 16 22 12 26 16 25 11 22 8 18 11Z" fill="#6f58a7" opacity=".9" />
        <path d="M19.5 18.5 21 18M23 18 24.5 18" stroke="#23150f" stroke-width="1" />
        <path d="M22 20.5 23.5 21" stroke="#6a3e2d" stroke-width=".8" />
        <path d="M17 24 22 27 27 24" fill="none" stroke="#c7a756" stroke-width="1.5" />
        <circle cx="22" cy="27.5" r="1.8" fill="#a78bfa" stroke="#fef3c7" stroke-width=".7" />
      </g>
    </svg>
  </div>
`;

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
  html: PLAYER_WAYFARER_HTML,
  iconSize: [PLAYER_MARKER_WIDTH, PLAYER_MARKER_HEIGHT],
  iconAnchor: [PLAYER_MARKER_WIDTH / 2, 48],
});

export const playerMarkerConfig: MarkerConfig = {
  icon: playerMarkerIcon,
  accessibility: buildMarkerAccessibilityState(PLAYER_MARKER_ARIA_LABEL),
};
