"use client";

import { memo, useMemo } from "react";
import AccessibleMarker from "@/components/AccessibleMarker";
import { getApproachReadout } from "@/lib/approach";
import { formatDistance } from "@/lib/distance";
import { getPoiTypeLabel } from "@/lib/poi-flavor";
import { createPoiMarkerConfig } from "@/lib/poi-marker-icons";
import type { POI } from "@/lib/types";
import { EXPLORE_RADIUS_METERS } from "@/lib/types";
import { Popup } from "react-leaflet";

interface PoiMapMarkerProps {
  poi: POI;
  visited: boolean;
  isSelected: boolean;
  playerLat: number;
  playerLng: number;
  onInteractPoi: (poi: POI) => void;
}

const PoiMapMarker = memo(function PoiMapMarker({
  poi,
  visited,
  isSelected,
  playerLat,
  playerLng,
  onInteractPoi,
}: PoiMapMarkerProps) {
  const readout = useMemo(
    () =>
      getApproachReadout(
        { lat: playerLat, lng: playerLng },
        poi,
        EXPLORE_RADIUS_METERS
      ),
    [playerLat, playerLng, poi]
  );
  const inRange = readout.status === "in_range";
  const markerConfig = useMemo(
    () =>
      createPoiMarkerConfig(poi, {
        selected: isSelected,
        visited,
        inRange: isSelected && inRange,
      }),
    [poi, isSelected, visited, inRange]
  );

  return (
    <AccessibleMarker
      position={[poi.lat, poi.lng]}
      icon={markerConfig.icon}
      accessibility={markerConfig.accessibility}
      onKeyboardActivate={() => onInteractPoi(poi)}
      eventHandlers={{ click: () => onInteractPoi(poi) }}
    >
      <Popup className="rpg-poi-bubble" closeButton={false} offset={[0, -4]}>
        <div className="rpg-poi-bubble__content">
          <p className="rpg-poi-bubble__name">{poi.name}</p>
          <p className="rpg-poi-bubble__meta">
            {getPoiTypeLabel(poi.type)} · {formatDistance(readout.distanceMeters)}
          </p>
          {visited ? (
            <p className="rpg-poi-bubble__prompt text-emerald-300">Explored</p>
          ) : isSelected && inRange ? (
            <p className="rpg-poi-bubble__prompt text-amber-200">Tap marker again</p>
          ) : isSelected ? (
            <p className="rpg-poi-bubble__prompt text-violet-100/85">
              {formatDistance(readout.distanceMeters)} · move closer
            </p>
          ) : null}
        </div>
      </Popup>
    </AccessibleMarker>
  );
});

export default PoiMapMarker;
