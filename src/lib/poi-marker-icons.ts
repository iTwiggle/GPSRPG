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

const POI_MARKER_SIZE = 46;
const POI_MARKER_ANCHOR_Y = 40;
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

const POI_WORLD_OBJECT_ART: Record<POIType, string> = {
  shrine: `
    <path d="M15 36 17 20 22 11 27 20 29 36Z" fill="#665a70" stroke="#21182d" stroke-width="2"/>
    <path d="M22 16 18.5 23 22 28 25.5 23Z" fill="none" stroke="#c4b5fd" stroke-width="2"/>
    <circle cx="22" cy="23" r="2.2" fill="#8b5cf6"/>
    <path d="M10 37 15 33M34 37 29 33" stroke="#8b7f8f" stroke-width="3" stroke-linecap="round"/>
  `,
  camp: `
    <path d="M8 36 18 19 27 36Z" fill="#9a4b2f" stroke="#2d160f" stroke-width="2"/>
    <path d="M18 19 34 36H27Z" fill="#713627" stroke="#2d160f" stroke-width="2"/>
    <path d="M18 20 18 36" stroke="#d39a62" stroke-width="1.4"/>
    <path d="M29 34 33 27 37 34Z" fill="#f97316" stroke="#7c2d12" stroke-width="1.5"/>
    <path d="M31 33 33 29 35 33Z" fill="#fde68a"/>
  `,
  tower: `
    <path d="M14 36V18L18 14V9H26V14L30 18V36Z" fill="#747983" stroke="#22252a" stroke-width="2"/>
    <path d="M14 18H30M17 23H27M17 29H27" stroke="#a9aeb5" stroke-width="1.3"/>
    <rect x="20" y="28" width="4" height="8" rx="1" fill="#262a30"/>
    <path d="M17 14H27" stroke="#d4d7dc" stroke-width="1.5"/>
  `,
  gate: `
    <path d="M9 36V23C9 14 14 9 22 9S35 14 35 23V36H29V24C29 18 27 15 22 15S15 18 15 24V36Z" fill="#8b7961" stroke="#30271e" stroke-width="2"/>
    <path d="M9 23H15M29 23H35M14 17 18 20M30 17 26 20" stroke="#c5ab7e" stroke-width="1.5"/>
    <path d="M13 36H31" stroke="#5c4934" stroke-width="3"/>
  `,
  grove: `
    <path d="M20 20V37M12 27V38M30 26V38" stroke="#5a3c24" stroke-width="3" stroke-linecap="round"/>
    <circle cx="20" cy="15" r="8" fill="#2f7d45" stroke="#123c25" stroke-width="2"/>
    <circle cx="12" cy="23" r="7" fill="#3d8f4d" stroke="#123c25" stroke-width="2"/>
    <circle cx="30" cy="22" r="7.5" fill="#287441" stroke="#123c25" stroke-width="2"/>
    <path d="M16 13 20 10 24 14M8 22 12 19 15 23M26 21 30 18 34 22" fill="none" stroke="#7fbd6d" stroke-width="1.2"/>
  `,
  cache: `
    <path d="M9 20C9 15 13 12 22 12S35 15 35 20V23H9Z" fill="#8b5e22" stroke="#2f1b08" stroke-width="2"/>
    <rect x="8" y="21" width="28" height="16" rx="2.5" fill="#9a651f" stroke="#2f1b08" stroke-width="2"/>
    <path d="M8 25H36M22 12V37" stroke="#d2a85b" stroke-width="1.5"/>
    <rect x="19.5" y="25" width="5" height="6" rx="1" fill="#facc15" stroke="#713f12" stroke-width="1"/>
  `,
  quarry: `
    <path d="M7 36 11 26 18 23 23 29 21 37Z" fill="#736d65" stroke="#292724" stroke-width="2"/>
    <path d="M20 36 24 20 31 17 37 25 35 37Z" fill="#868078" stroke="#292724" stroke-width="2"/>
    <path d="M12 28 17 26M26 22 31 20" stroke="#b8b1a5" stroke-width="1.3"/>
    <path d="M12 12 34 28M29 10 14 31" stroke="#c5aa78" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M8 10C14 8 18 9 23 13" fill="none" stroke="#d6d3d1" stroke-width="2.5" stroke-linecap="round"/>
  `,
  well: `
    <ellipse cx="22" cy="26" rx="13" ry="7" fill="#706c66" stroke="#292725" stroke-width="2"/>
    <ellipse cx="22" cy="24" rx="9" ry="4.5" fill="#2396bd" stroke="#b9e6f4" stroke-width="1.5"/>
    <path d="M10 26V35C10 39 34 39 34 35V26" fill="#625e58" stroke="#292725" stroke-width="2"/>
    <path d="M14 18V9M30 18V9M14 10H30" stroke="#7a5532" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M22 10V20" stroke="#b8925f" stroke-width="1.5"/>
  `,
};

function buildPoiWorldObjectHtml(
  type: POIType,
  options: PoiMarkerOptions
): string {
  const { selected = false, visited = false, inRange = false } = options;
  const haloColor = selected ? (inRange ? "#34d399" : "#fbbf24") : null;
  const halo = haloColor
    ? `<ellipse cx="22" cy="34" rx="18" ry="10" fill="none" stroke="${haloColor}" stroke-width="${inRange ? 2.4 : 2}" opacity=".95"/>`
    : "";
  const visitedBadge = visited
    ? `
      <circle cx="36" cy="9" r="6" fill="#065f46" stroke="#a7f3d0" stroke-width="1.4"/>
      <path d="m33.5 9 1.7 1.8 3.5-4" fill="none" stroke="#ecfdf5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    `
    : "";
  const artOpacity = visited ? 0.62 : 1;

  return `
    <div
      class="poi-world-object"
      aria-hidden="true"
      style="position:relative;width:${POI_MARKER_SIZE}px;height:${POI_MARKER_SIZE}px;overflow:visible;"
    >
      <span class="poi-marker-glyph" aria-hidden="true" style="display:none;"></span>
      <svg
        class="poi-world-object-art"
        width="${POI_MARKER_SIZE}"
        height="${POI_MARKER_SIZE}"
        viewBox="0 0 44 44"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
        style="overflow:visible;filter:drop-shadow(0 2px 3px rgba(0,0,0,.72));"
      >
        <ellipse cx="22" cy="38" rx="13" ry="3.3" fill="#020617" opacity=".52"/>
        ${halo}
        <g opacity="${artOpacity}" stroke-linejoin="round" stroke-linecap="round">
          ${POI_WORLD_OBJECT_ART[type]}
        </g>
        ${visitedBadge}
      </svg>
    </div>
  `;
}

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
    html: buildPoiWorldObjectHtml(type, options),
    iconSize: [POI_MARKER_SIZE, POI_MARKER_SIZE],
    iconAnchor: [POI_MARKER_SIZE / 2, POI_MARKER_ANCHOR_Y],
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
