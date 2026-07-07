"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type GeolocationSnapshot,
  watchPlayerPosition,
} from "@/lib/geolocation";
import { DEMO_POSITION, type Position } from "@/lib/types";

interface UseGeolocationResult extends GeolocationSnapshot {
  isDemo: boolean;
  enableDemoMode: () => void;
  retryLiveGps: () => void;
  setSimulatedPosition: (position: Position) => void;
  nudgePosition: (northMeters: number, eastMeters: number) => void;
}

export function useGeolocation(): UseGeolocationResult {
  const [snapshot, setSnapshot] = useState<GeolocationSnapshot>({
    position: null,
    accuracy: null,
    status: "idle",
    error: null,
  });
  const [isDemo, setIsDemo] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (isDemo) return undefined;

    const stop = watchPlayerPosition((next) => {
      setSnapshot(next);
      if (
        next.status === "denied" ||
        next.status === "timeout" ||
        next.status === "unavailable"
      ) {
        setIsDemo(true);
        setSnapshot({
          position: DEMO_POSITION,
          accuracy: 25,
          status: "demo",
          error: next.error,
        });
      }
    });

    return stop;
  }, [isDemo, retryNonce]);

  const enableDemoMode = useCallback(() => {
    setIsDemo(true);
    setSnapshot({
      position: DEMO_POSITION,
      accuracy: 25,
      status: "demo",
      error: null,
    });
  }, []);

  const retryLiveGps = useCallback(() => {
    setIsDemo(false);
    setSnapshot({
      position: null,
      accuracy: null,
      status: "requesting",
      error: null,
    });
    setRetryNonce((value) => value + 1);
  }, []);

  const setSimulatedPosition = useCallback((position: Position) => {
    setIsDemo(true);
    setSnapshot({
      position,
      accuracy: 10,
      status: "demo",
      error: null,
    });
  }, []);

  const nudgePosition = useCallback(
    (northMeters: number, eastMeters: number) => {
      setSnapshot((prev) => {
        if (!prev.position) {
          const base = DEMO_POSITION;
          const latOffset = northMeters / 111_320;
          const lngOffset =
            eastMeters / (111_320 * Math.cos((base.lat * Math.PI) / 180));
          return {
            position: {
              lat: base.lat + latOffset,
              lng: base.lng + lngOffset,
            },
            accuracy: 10,
            status: "demo",
            error: null,
          };
        }

        const latOffset = northMeters / 111_320;
        const lngOffset =
          eastMeters /
          (111_320 * Math.cos((prev.position.lat * Math.PI) / 180));

        return {
          ...prev,
          position: {
            lat: prev.position.lat + latOffset,
            lng: prev.position.lng + lngOffset,
          },
          status: "demo",
          error: null,
        };
      });
      setIsDemo(true);
    },
    []
  );

  return {
    ...snapshot,
    isDemo,
    enableDemoMode,
    retryLiveGps,
    setSimulatedPosition,
    nudgePosition,
  };
}
