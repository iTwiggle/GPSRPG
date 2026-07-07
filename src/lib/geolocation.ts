import type { Position } from "./types";

export type GeolocationStatus =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "timeout"
  | "unavailable"
  | "demo";

export interface GeolocationSnapshot {
  position: Position | null;
  accuracy: number | null;
  status: GeolocationStatus;
  error: string | null;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 5_000,
  timeout: 15_000,
};

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export function watchPlayerPosition(
  onUpdate: (snapshot: GeolocationSnapshot) => void,
  options: PositionOptions = DEFAULT_OPTIONS
): () => void {
  if (!isGeolocationSupported()) {
    onUpdate({
      position: null,
      accuracy: null,
      status: "unavailable",
      error: "Geolocation is not supported in this browser.",
    });
    return () => {};
  }

  onUpdate({
    position: null,
    accuracy: null,
    status: "requesting",
    error: null,
  });

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      onUpdate({
        position: {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        },
        accuracy: pos.coords.accuracy,
        status: "active",
        error: null,
      });
    },
    (err) => {
      let status: GeolocationStatus = "unavailable";
      if (err.code === err.PERMISSION_DENIED) {
        status = "denied";
      } else if (err.code === err.TIMEOUT) {
        status = "timeout";
      }

      onUpdate({
        position: null,
        accuracy: null,
        status,
        error: err.message,
      });
    },
    options
  );

  return () => navigator.geolocation.clearWatch(watchId);
}
