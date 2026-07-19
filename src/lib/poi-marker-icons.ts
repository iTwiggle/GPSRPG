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

// ── Player sprite variants ──────────────────────────────────────────────────
// Three distinct designs. Set ACTIVE_PLAYER_SPRITE to switch between them.
//   0 = Hooded Ranger  (swift, earthy greens)
//   1 = Armored Knight (bold, steel & gold — default)
//   2 = Robed Mage     (arcane, deep blue & violet)

const SHARED_ANIMATION_STYLE = `
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
      50%       { transform: translateY(-2px); }
    }
    @keyframes player-wayfarer-shadow {
      0%, 100% { transform: scaleX(1);   opacity: .52; }
      50%      { transform: scaleX(.84); opacity: .36; }
    }
    @media (prefers-reduced-motion: reduce) {
      .player-wayfarer-bob,
      .player-wayfarer-shadow { animation: none; }
    }
  </style>`;

/** Variant 0 — Hooded Ranger */
const SPRITE_RANGER = `
  ${SHARED_ANIMATION_STYLE}
  <ellipse class="player-wayfarer-shadow" cx="22" cy="48" rx="9" ry="3" fill="#020617" opacity=".52"/>
  <g class="player-wayfarer-bob" stroke-linejoin="round" stroke-linecap="round">
    <!-- legs -->
    <path d="M17 40 15 49 19 50 21 42Z" fill="#3b2a1a" stroke="#0f0905" stroke-width="1.4"/>
    <path d="M27 40 29 49 25 50 23 42Z" fill="#3b2a1a" stroke="#0f0905" stroke-width="1.4"/>
    <!-- boots -->
    <path d="M14 48 19 48 19 52 13 52Z" fill="#1a120d" stroke="#080403" stroke-width="1.2"/>
    <path d="M25 48 31 48 32 52 25 52Z" fill="#1a120d" stroke="#080403" stroke-width="1.2"/>
    <!-- cloak body -->
    <path d="M14 24 9 32 10 42 17 46 22 40 27 46 34 42 35 32 30 24Z"
      fill="#2d5a27" stroke="#0e1f0c" stroke-width="2"/>
    <!-- cloak highlight -->
    <path d="M16 28 14 34 16 40 22 36 28 40 30 34 28 28 22 32Z"
      fill="#3d7a35" stroke="#122b10" stroke-width="1.4"/>
    <!-- left arm + bow grip -->
    <path d="M9 32 5 40 8 41 11 34Z" fill="#6b4c2a" stroke="#1c110a" stroke-width="1.4"/>
    <!-- right arm -->
    <path d="M35 32 39 40 36 41 33 34Z" fill="#6b4c2a" stroke="#1c110a" stroke-width="1.4"/>
    <!-- quiver strap -->
    <path d="M29 25 31 42" stroke="#8b6d3a" stroke-width="2" stroke-linecap="round"/>
    <rect x="29" y="25" width="4" height="11" rx="1.5" fill="#5c3d18" stroke="#1c110a" stroke-width="1.2"/>
    <!-- arrows in quiver -->
    <path d="M30 25 30 20M32 25 32 21" stroke="#d4a84b" stroke-width="1" stroke-linecap="round"/>
    <!-- hood -->
    <path d="M14 20 13 12 17 7 22 5 27 7 31 12 30 20 26 26 18 26Z"
      fill="#1e3d1b" stroke="#080f07" stroke-width="2"/>
    <!-- face -->
    <path d="M17 18 18 12 22 10 26 12 27 18 25 23 19 23Z"
      fill="#c4855a" stroke="#3a1f10" stroke-width="1.2"/>
    <!-- hood shadow over brow -->
    <path d="M15 16 17 12 22 10 27 12 29 16 26 14 22 13 18 14Z"
      fill="#162d13" opacity=".85"/>
    <!-- eyes -->
    <circle cx="19.5" cy="17" r="1" fill="#1a0e08"/>
    <circle cx="24.5" cy="17" r="1" fill="#1a0e08"/>
    <!-- belt -->
    <path d="M16 29 28 29" stroke="#a07840" stroke-width="2"/>
    <rect x="20.5" y="28" width="3" height="2.5" rx=".6" fill="#d4a030" stroke="#5c3d12" stroke-width=".7"/>
  </g>`;

/** Variant 1 — Armored Knight (default) */
const SPRITE_KNIGHT = `
  ${SHARED_ANIMATION_STYLE}
  <ellipse class="player-wayfarer-shadow" cx="22" cy="48" rx="10" ry="3.2" fill="#020617" opacity=".52"/>
  <g class="player-wayfarer-bob" stroke-linejoin="round" stroke-linecap="round">
    <!-- greaves -->
    <path d="M17 40 15 48 20 49 22 41Z" fill="#4a5568" stroke="#1a202c" stroke-width="1.5"/>
    <path d="M27 40 29 48 24 49 22 41Z" fill="#4a5568" stroke="#1a202c" stroke-width="1.5"/>
    <!-- sabatons -->
    <path d="M13 47 20 47 21 51 12 51Z" fill="#2d3748" stroke="#0d1117" stroke-width="1.2"/>
    <path d="M24 47 31 47 32 51 23 51Z" fill="#2d3748" stroke="#0d1117" stroke-width="1.2"/>
    <!-- plate torso -->
    <path d="M14 23 9 31 10 43 18 46 22 41 26 46 34 43 35 31 30 23Z"
      fill="#718096" stroke="#1a202c" stroke-width="2"/>
    <!-- chest plate highlight -->
    <path d="M16 27 14 33 16 40 22 37 28 40 30 33 28 27 22 30Z"
      fill="#a0aec0" stroke="#2d3748" stroke-width="1.4"/>
    <!-- gold trim chest -->
    <path d="M16 28 28 28" stroke="#d4a017" stroke-width="1.8"/>
    <path d="M22 28 22 36" stroke="#d4a017" stroke-width="1.4"/>
    <!-- left pauldron + arm -->
    <path d="M9 25 13 23 15 29 10 34Z" fill="#a0aec0" stroke="#2d3748" stroke-width="1.5"/>
    <path d="M9 34 6 41 9 43 13 36Z" fill="#718096" stroke="#1a202c" stroke-width="1.4"/>
    <!-- right pauldron + arm -->
    <path d="M35 25 31 23 29 29 34 34Z" fill="#a0aec0" stroke="#2d3748" stroke-width="1.5"/>
    <path d="M35 34 38 41 35 43 31 36Z" fill="#718096" stroke="#1a202c" stroke-width="1.4"/>
    <!-- sword handle (right side) -->
    <path d="M36 40 39 48" stroke="#6b4c2a" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M34 39 41 41" stroke="#d4a017" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M38 46 40 50Z" fill="#b8860b" stroke="#5c3d12" stroke-width="1"/>
    <!-- helmet -->
    <path d="M14 21 14 13 17 7 22 5 27 7 30 13 30 21 27 26 17 26Z"
      fill="#718096" stroke="#1a202c" stroke-width="2"/>
    <!-- visor -->
    <path d="M15 17 15 21 29 21 29 17Z" fill="#2d3748" stroke="#1a202c" stroke-width="1.2"/>
    <!-- eye slits -->
    <path d="M17 18.5 21 18.5" stroke="#f6c90e" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M23 18.5 27 18.5" stroke="#f6c90e" stroke-width="1.2" stroke-linecap="round"/>
    <!-- helm crest -->
    <path d="M18 7 22 3 26 7" fill="none" stroke="#e53e3e" stroke-width="2.5" stroke-linecap="round"/>
    <!-- gold helm trim -->
    <path d="M14 13 30 13" stroke="#d4a017" stroke-width="1.5"/>
    <!-- shield (left) -->
    <path d="M5 30 5 41 9 44 13 41 13 30 9 27Z"
      fill="#c53030" stroke="#742a2a" stroke-width="1.8"/>
    <path d="M9 30 9 42" stroke="#e2a000" stroke-width="1.2"/>
    <path d="M6 36 12 36" stroke="#e2a000" stroke-width="1.2"/>
  </g>`;

/** Variant 2 — Robed Mage */
const SPRITE_MAGE = `
  ${SHARED_ANIMATION_STYLE}
  <ellipse class="player-wayfarer-shadow" cx="22" cy="48" rx="9" ry="3" fill="#020617" opacity=".52"/>
  <g class="player-wayfarer-bob" stroke-linejoin="round" stroke-linecap="round">
    <!-- robe base -->
    <path d="M15 24 10 33 11 44 17 48 22 43 27 48 33 44 34 33 29 24Z"
      fill="#1e3a5f" stroke="#0a1628" stroke-width="2"/>
    <!-- robe shading -->
    <path d="M17 28 15 35 17 43 22 39 27 43 29 35 27 28 22 32Z"
      fill="#2a5080" stroke="#0f2240" stroke-width="1.4"/>
    <!-- rune trim on robe -->
    <path d="M16 35 28 35" stroke="#7ec8e3" stroke-width="1.2" opacity=".8"/>
    <path d="M17 38 27 38" stroke="#7ec8e3" stroke-width=".8" opacity=".6"/>
    <!-- sleeves -->
    <path d="M10 33 6 40 9 42 13 36Z" fill="#1e3a5f" stroke="#0a1628" stroke-width="1.4"/>
    <path d="M34 33 38 40 35 42 31 36Z" fill="#1e3a5f" stroke="#0a1628" stroke-width="1.4"/>
    <!-- hands -->
    <ellipse cx="7.5" cy="41.5" rx="2.2" ry="2" fill="#c4855a" stroke="#3a1f10" stroke-width="1"/>
    <ellipse cx="36.5" cy="41.5" rx="2.2" ry="2" fill="#c4855a" stroke="#3a1f10" stroke-width="1"/>
    <!-- staff -->
    <path d="M37 42 40 18" stroke="#6b4c2a" stroke-width="2.4" stroke-linecap="round"/>
    <!-- staff crystal -->
    <path d="M40 18 37 13 40 8 43 13Z" fill="#7c3aed" stroke="#ddd6fe" stroke-width="1"/>
    <circle cx="40" cy="13" r="2.5" fill="#a78bfa" opacity=".9"/>
    <!-- orb in left hand -->
    <circle cx="7.5" cy="40" r="3.5" fill="#1e3a8a" stroke="#93c5fd" stroke-width="1"/>
    <circle cx="6.5" cy="39" r="1.2" fill="#93c5fd" opacity=".7"/>
    <!-- hat -->
    <path d="M12 21 14 13 18 8 22 5 26 8 30 13 32 21 26 25 18 25Z"
      fill="#1a2f52" stroke="#08111f" stroke-width="2"/>
    <path d="M18 8 22 3 26 8" fill="#1a2f52" stroke="#08111f" stroke-width="2"/>
    <!-- hat brim -->
    <path d="M10 21 34 21" stroke="#2d5080" stroke-width="2.5" stroke-linecap="round"/>
    <!-- hat star emblem -->
    <path d="M22 10 23 13 22 16 21 13Z M19.5 11.5 22.5 12.5 25.5 11.5 22.5 14.5Z"
      fill="#f6c90e" opacity=".9"/>
    <!-- face -->
    <path d="M17 19 18 13 22 11 26 13 27 19 25 23 19 23Z"
      fill="#c4855a" stroke="#3a1f10" stroke-width="1.2"/>
    <!-- eyes (glowing) -->
    <circle cx="20" cy="17.5" r="1.3" fill="#7c3aed"/>
    <circle cx="24" cy="17.5" r="1.3" fill="#7c3aed"/>
    <circle cx="20" cy="17.5" r=".6" fill="#ddd6fe"/>
    <circle cx="24" cy="17.5" r=".6" fill="#ddd6fe"/>
    <!-- beard -->
    <path d="M18 22 22 25 26 22" fill="none" stroke="#d1c7b8" stroke-width="1.2" stroke-linecap="round"/>
    <!-- belt with pouch -->
    <path d="M16 30 28 30" stroke="#8b6d3a" stroke-width="2"/>
    <rect x="20" y="29" width="4" height="3" rx=".8" fill="#d4a030" stroke="#5c3d12" stroke-width=".8"/>
  </g>`;

const PLAYER_SPRITES = [SPRITE_RANGER, SPRITE_KNIGHT, SPRITE_MAGE] as const;

/** Change this index to switch the active player sprite (0=Ranger, 1=Knight, 2=Mage) */
const ACTIVE_PLAYER_SPRITE = 1;

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
      ${PLAYER_SPRITES[ACTIVE_PLAYER_SPRITE]}
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
    // Keep the interaction bubble completely above the authored world object.
    // Without an explicit anchor Leaflet places the popup tip at ground level,
    // causing the panel to cover the marker that needs a second tap.
    popupAnchor: [0, -POI_MARKER_ANCHOR_Y - 8],
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
