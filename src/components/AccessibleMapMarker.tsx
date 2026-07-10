"use client";

import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Marker as LeafletMarker,
  type MarkerProps,
} from "react-leaflet";
import {
  applyMarkerAccessibility,
  type MarkerAccessibility,
} from "@/lib/marker-accessibility";

interface AccessibleMapMarkerProps
  extends Omit<MarkerProps, "interactive" | "keyboard"> {
  accessibility: MarkerAccessibility;
  onActivate?: () => void;
}

export default function AccessibleMapMarker({
  accessibility,
  eventHandlers,
  onActivate,
  ...markerProps
}: AccessibleMapMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const accessibilityRef = useRef(accessibility);

  const syncAccessibility = useCallback(() => {
    if (markerRef.current) {
      applyMarkerAccessibility(markerRef.current, accessibilityRef.current);
    }
  }, []);

  const setMarkerRef = useCallback(
    (marker: L.Marker | null) => {
      if (markerRef.current) {
        markerRef.current.off("add", syncAccessibility);
      }

      markerRef.current = marker;

      if (marker) {
        marker.on("add", syncAccessibility);
        syncAccessibility();
      }
    },
    [syncAccessibility]
  );

  useEffect(() => {
    accessibilityRef.current = accessibility;
    syncAccessibility();
  }, [accessibility, syncAccessibility]);

  const accessibleEventHandlers = useMemo<MarkerProps["eventHandlers"]>(
    () => {
      if (!accessibility.interactive) return undefined;
      if (!onActivate) return eventHandlers;

      return {
        ...eventHandlers,
        click: (event) => {
          eventHandlers?.click?.(event);
          onActivate();
        },
        keypress: (event) => {
          eventHandlers?.keypress?.(event);
          if (event.originalEvent.key === "Enter") {
            onActivate();
          }
        },
      };
    },
    [accessibility.interactive, eventHandlers, onActivate]
  );

  return (
    <LeafletMarker
      {...markerProps}
      eventHandlers={accessibleEventHandlers}
      ref={setMarkerRef}
      interactive={accessibility.interactive}
      keyboard={accessibility.interactive}
    />
  );
}
