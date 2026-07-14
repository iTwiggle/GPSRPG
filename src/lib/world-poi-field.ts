import { distanceMeters } from "./distance";
import {
  buildPoiName,
  pickPoiFlavor,
  pickPoiType,
} from "./poi-flavor";
import {
  cellKeyToString,
  getAreaCellCenter,
  getAreaCellKey,
  type AreaCellKey,
  type OsmContextCategory,
} from "./osm-context";
import { POI_CELL_SIZE_METERS } from "./poi-generator";
import { hashSeedNumeric, seededRandom } from "./prng";
import type { POI, Position } from "./types";

export const WORLD_POI_ACTIVE_RADIUS_METERS = 520;
export const WORLD_POIS_PER_CELL = 2;
const WORLD_FIELD_CELL_RADIUS = 2;

function metersToLatLngOffset(
  originLat: number,
  northMeters: number,
  eastMeters: number
): Position {
  return {
    lat: northMeters / 111_320,
    lng:
      eastMeters /
      (111_320 * Math.cos((originLat * Math.PI) / 180)),
  };
}

/**
 * Enumerate a stable neighborhood of world cells around the player.
 * The neighborhood is deliberately larger than the active POI radius so POIs
 * can cross the distance boundary individually instead of changing by column.
 */
export function getWorldFieldCells(player: Position): AreaCellKey[] {
  const currentCell = getAreaCellKey(player.lat, player.lng);
  const currentCenter = getAreaCellCenter(currentCell);
  const latStep = POI_CELL_SIZE_METERS / 111_320;
  const cells = new Map<string, AreaCellKey>();

  for (let row = -WORLD_FIELD_CELL_RADIUS; row <= WORLD_FIELD_CELL_RADIUS; row++) {
    const targetLat = currentCenter.lat + row * latStep;
    const lngStep =
      POI_CELL_SIZE_METERS /
      (111_320 * Math.cos((targetLat * Math.PI) / 180));

    for (
      let col = -WORLD_FIELD_CELL_RADIUS;
      col <= WORLD_FIELD_CELL_RADIUS;
      col++
    ) {
      const targetLng = currentCenter.lng + col * lngStep;
      const cell = getAreaCellKey(targetLat, targetLng);
      cells.set(cellKeyToString(cell), cell);
    }
  }

  return [...cells.values()];
}

/**
 * Generate the stable POIs owned by one world cell.
 * Position, type, name, and ID depend only on cell coordinates + POI index.
 * Area context may tint flavor copy, but cannot move or replace the site.
 */
export function generateWorldCellPois(
  cell: AreaCellKey,
  areaContext: OsmContextCategory = "generic",
  count: number = WORLD_POIS_PER_CELL
): POI[] {
  const center = getAreaCellCenter(cell);
  const pois: POI[] = [];

  for (let index = 0; index < count; index++) {
    const placementRand = seededRandom(
      hashSeedNumeric(cell.cellLat, cell.cellLng, index, 991)
    );
    const northMeters =
      (placementRand() - 0.5) * POI_CELL_SIZE_METERS * 0.76;
    const eastMeters =
      (placementRand() - 0.5) * POI_CELL_SIZE_METERS * 0.76;
    const offset = metersToLatLngOffset(
      center.lat,
      northMeters,
      eastMeters
    );

    const typeRand = seededRandom(
      hashSeedNumeric(cell.cellLat, cell.cellLng, index, 17)
    );
    const type = pickPoiType("generic", typeRand);
    const nameRand = seededRandom(
      hashSeedNumeric(cell.cellLat, cell.cellLng, index, 31)
    );
    const flavorRand = seededRandom(
      hashSeedNumeric(cell.cellLat, cell.cellLng, index, 47)
    );

    pois.push({
      id: `poi-${cell.cellLat.toFixed(6)}-${cell.cellLng.toFixed(6)}-${index}`,
      name: buildPoiName(type, nameRand, "generic"),
      type,
      flavor: pickPoiFlavor(type, flavorRand, areaContext),
      lat: center.lat + offset.lat,
      lng: center.lng + offset.lng,
    });
  }

  return pois;
}

/**
 * Generate all stable POIs for the world-cell neighborhood around the player.
 * This only changes when the player crosses into a new ~400 m area cell.
 */
export function generateWorldFieldPois(
  player: Position,
  currentAreaContext: OsmContextCategory = "generic"
): POI[] {
  const currentCellKey = cellKeyToString(
    getAreaCellKey(player.lat, player.lng)
  );

  return getWorldFieldCells(player).flatMap((cell) =>
    generateWorldCellPois(
      cell,
      cellKeyToString(cell) === currentCellKey
        ? currentAreaContext
        : "generic"
    )
  );
}

/** Keep POIs inside the active radius and sort by distance from the player. */
export function filterActiveWorldPois(
  pois: POI[],
  player: Position
): POI[] {
  return pois
    .filter(
      (poi) =>
        distanceMeters(player, poi) <= WORLD_POI_ACTIVE_RADIUS_METERS
    )
    .sort(
      (a, b) => distanceMeters(player, a) - distanceMeters(player, b)
    );
}

/**
 * Build the active rolling POI field. POIs are owned by stable world cells and
 * enter/leave only when their own distance crosses the active radius.
 */
export function buildWorldPoiField(
  player: Position,
  currentAreaContext: OsmContextCategory = "generic"
): POI[] {
  return filterActiveWorldPois(
    generateWorldFieldPois(player, currentAreaContext),
    player
  );
}
