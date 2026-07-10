"use client";

import { useCallback, useEffect, useRef } from "react";
import { Marker, type MarkerProps } from "react-leaflet";
import type L from "leaflet";
import {
  syncMarkerAccessibility,
  type MarkerAccessibilityState,
} from "@/lib/marker-a11y";

export interface AccessibleMarkerProps extends MarkerProps {
  accessibility: MarkerAccessibilityState;
  onKeyboardActivate?: () => void;
}

export default function AccessibleMarker({
  accessibility,
  onKeyboardActivate,
  eventHandlers,
  icon,
  ...props
}: AccessibleMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const keyboardCleanupRef = useRef<(() => void) | null>(null);

  const syncAccessibility = useCallback(
    (marker: L.Marker) => {
      keyboardCleanupRef.current?.();
      keyboardCleanupRef.current =
        syncMarkerAccessibility(marker, accessibility, {
          onActivate:
            onKeyboardActivate ??
            (accessibility.interactive
              ? () => {
                  marker.fire("click");
                }
              : undefined),
        }) ?? null;
    },
    [accessibility, onKeyboardActivate]
  );

  const setMarkerRef = useCallback(
    (instance: L.Marker | null) => {
      markerRef.current = instance;

      if (instance) {
        syncAccessibility(instance);
      }
    },
    [syncAccessibility]
  );

  useEffect(() => {
    if (markerRef.current) {
      syncAccessibility(markerRef.current);
    }

    return () => {
      keyboardCleanupRef.current?.();
      keyboardCleanupRef.current = null;
    };
  }, [syncAccessibility, icon]);

  return (
    <Marker
      {...props}
      icon={icon}
      ref={setMarkerRef}
      eventHandlers={{
        ...eventHandlers,
        add: (event) => {
          syncAccessibility(event.target);
          eventHandlers?.add?.(event);
        },
      }}
    />
  );
}
