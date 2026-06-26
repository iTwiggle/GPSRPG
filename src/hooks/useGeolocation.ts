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

  useEffect(() => {
    if (isDemo) return undefined;

    const stop = watchPlayerPosition((next) => {
      setSnapshot(next);
      if (next.status === "denied" || next.status === "unavailable") {
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
  }, [isDemo]);

  const enableDemoMode = useCallback(() => {
    setIsDemo(true);
    setSnapshot({
      position: DEMO_POSITION,
      accuracy: 25,
      status: "demo",
      error: null,
    });
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
          status: isDemo ? "demo" : prev.status,
        };
      });
      setIsDemo(true);
    },
    [isDemo]
  );

  return {
    ...snapshot,
    isDemo,
    enableDemoMode,
    setSimulatedPosition,
    nudgePosition,
  };
}
