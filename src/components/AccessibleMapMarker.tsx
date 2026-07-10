"use client";

import L from "leaflet";
import { useCallback, useEffect, useRef } from "react";
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
}

export default function AccessibleMapMarker({
  accessibility,
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

  return (
    <LeafletMarker
      {...markerProps}
      ref={setMarkerRef}
      interactive={accessibility.interactive}
      keyboard={accessibility.interactive}
    />
  );
}
