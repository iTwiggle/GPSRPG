"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type GeolocationSnapshot,
  watchPlayerPosition,
} from "@/lib/geolocation";
import {
  inferLegacyLiveConsent,
  readLocationConsent,
  writeLocationConsent,
} from "@/lib/location-consent";
import { DEMO_POSITION, type Position } from "@/lib/types";

interface UseGeolocationResult extends GeolocationSnapshot {
  isDemo: boolean;
  hasLocationConsent: boolean;
  startLiveGps: () => void;
  enableDemoMode: () => void;
  retryLiveGps: () => void;
  setSimulatedPosition: (position: Position) => void;
  nudgePosition: (northMeters: number, eastMeters: number) => void;
}

function demoSnapshot(error: string | null = null): GeolocationSnapshot {
  return {
    position: DEMO_POSITION,
    accuracy: 25,
    status: "demo",
    error,
  };
}

export function useGeolocation(): UseGeolocationResult {
  const [snapshot, setSnapshot] = useState<GeolocationSnapshot>({
    position: null,
    accuracy: null,
    status: "idle",
    error: null,
  });
  const [isDemo, setIsDemo] = useState(false);
  const [hasLocationConsent, setHasLocationConsent] = useState(false);
  const [liveGpsEnabled, setLiveGpsEnabled] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const nudgeQueueRef = useRef({ north: 0, east: 0 });
  const nudgeFrameRef = useRef<number | null>(null);
  const isDemoRef = useRef(false);

  useEffect(() => {
    isDemoRef.current = isDemo;
  }, [isDemo]);

  useEffect(() => {
    return () => {
      if (nudgeFrameRef.current !== null) {
        cancelAnimationFrame(nudgeFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const consent = readLocationConsent() ?? (inferLegacyLiveConsent() ? "live" : null);
    if (!consent) return;

    if (consent === "live" && !readLocationConsent()) {
      writeLocationConsent("live");
    }

    setHasLocationConsent(true);
    if (consent === "demo") {
      setIsDemo(true);
      setSnapshot(demoSnapshot());
      return;
    }

    setLiveGpsEnabled(true);
  }, []);

  useEffect(() => {
    if (!liveGpsEnabled || isDemo) return undefined;

    const stop = watchPlayerPosition((next) => {
      setSnapshot(next);
      if (
        next.status === "denied" ||
        next.status === "timeout" ||
        next.status === "unavailable"
      ) {
        setIsDemo(true);
        setSnapshot(demoSnapshot(next.error));
      }
    });

    return stop;
  }, [isDemo, liveGpsEnabled, retryNonce]);

  const startLiveGps = useCallback(() => {
    writeLocationConsent("live");
    setHasLocationConsent(true);
    setIsDemo(false);
    setLiveGpsEnabled(true);
    setSnapshot({
      position: null,
      accuracy: null,
      status: "requesting",
      error: null,
    });
    setRetryNonce((value) => value + 1);
  }, []);

  const enableDemoMode = useCallback(() => {
    writeLocationConsent("demo");
    setHasLocationConsent(true);
    setIsDemo(true);
    setLiveGpsEnabled(false);
    setSnapshot(demoSnapshot());
  }, []);

  const retryLiveGps = useCallback(() => {
    startLiveGps();
  }, [startLiveGps]);

  const setSimulatedPosition = useCallback((position: Position) => {
    writeLocationConsent("demo");
    setHasLocationConsent(true);
    setIsDemo(true);
    setLiveGpsEnabled(false);
    setSnapshot({
      position,
      accuracy: 10,
      status: "demo",
      error: null,
    });
  }, []);

  const applyPositionDelta = useCallback(
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
    },
    []
  );

  const flushNudgeQueue = useCallback(() => {
    nudgeFrameRef.current = null;
    const { north, east } = nudgeQueueRef.current;
    if (north === 0 && east === 0) return;

    nudgeQueueRef.current = { north: 0, east: 0 };

    if (!isDemoRef.current) {
      writeLocationConsent("demo");
      setHasLocationConsent(true);
      setIsDemo(true);
      setLiveGpsEnabled(false);
    }

    applyPositionDelta(north, east);
  }, [applyPositionDelta]);

  const nudgePosition = useCallback(
    (northMeters: number, eastMeters: number) => {
      nudgeQueueRef.current.north += northMeters;
      nudgeQueueRef.current.east += eastMeters;
      if (nudgeFrameRef.current !== null) return;
      nudgeFrameRef.current = requestAnimationFrame(flushNudgeQueue);
    },
    [flushNudgeQueue]
  );

  return {
    ...snapshot,
    isDemo,
    hasLocationConsent,
    startLiveGps,
    enableDemoMode,
    retryLiveGps,
    setSimulatedPosition,
    nudgePosition,
  };
}
