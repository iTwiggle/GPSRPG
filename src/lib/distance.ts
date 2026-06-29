const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Haversine distance between two GPS coordinates in meters. */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/** Offset a position by meters (approximate, good for short distances). */
export function offsetPosition(
  position: { lat: number; lng: number },
  northMeters: number,
  eastMeters: number
): { lat: number; lng: number } {
  const latOffset = northMeters / 111_320;
  const lngOffset =
    eastMeters / (111_320 * Math.cos(toRadians(position.lat)));

  return {
    lat: position.lat + latOffset,
    lng: position.lng + lngOffset,
  };
}

export function isWithinRadius(
  player: { lat: number; lng: number },
  target: { lat: number; lng: number },
  radiusMeters: number
): boolean {
  return distanceMeters(player, target) <= radiusMeters;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Initial bearing from `from` to `to` in degrees (0 = north, clockwise).
 */
export function bearingDegrees(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const dLng = toRadians(to.lng - from.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const radians = Math.atan2(y, x);
  const degrees = (radians * 180) / Math.PI;
  return (degrees + 360) % 360;
}

const CARDINAL_BEARINGS = [
  "North",
  "North-East",
  "East",
  "South-East",
  "South",
  "South-West",
  "West",
  "North-West",
] as const;

/** Map a bearing in degrees to an eight-point compass label. */
export function formatCardinalBearing(degrees: number): string {
  const index = Math.round(degrees / 45) % 8;
  return CARDINAL_BEARINGS[index];
}

/** Unicode arrow glyph rotated to point toward the bearing (0 = north). */
export function bearingArrowGlyph(degrees: number): string {
  const arrows = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"] as const;
  const index = Math.round(degrees / 45) % 8;
  return arrows[index];
}
