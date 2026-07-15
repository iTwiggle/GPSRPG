"use client";

import { memo, useMemo } from "react";
import AccessibleMarker from "@/components/AccessibleMarker";
import { getApproachReadout } from "@/lib/approach";
import { formatDistance } from "@/lib/distance";
import { getPoiTypeLabel } from "@/lib/poi-flavor";
import { createPoiMarkerConfig } from "@/lib/poi-marker-icons";
import {
  formatCooldownRemaining,
  getCooldownRemainingMs,
  type PoiVisitUiStatus,
} from "@/lib/temporal/poi-cooldowns";
import { getTodayCooldownOptions } from "@/lib/temporal/world-modifier";
import type { POI, VisitedPoiState } from "@/lib/types";
import { EXPLORE_RADIUS_METERS } from "@/lib/types";
import { Popup } from "react-leaflet";

interface PoiMapMarkerProps {
  poi: POI;
  visit?: VisitedPoiState;
  visitStatus: PoiVisitUiStatus;
  isSelected: boolean;
  playerLat: number;
  playerLng: number;
  onInteractPoi: (poi: POI) => void;
}

const PoiMapMarker = memo(function PoiMapMarker({
  poi,
  visit,
  visitStatus,
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
  const visited =
    visitStatus === "landmark_done" || visitStatus === "cooldown";
  const markerConfig = useMemo(
    () =>
      createPoiMarkerConfig(poi, {
        selected: isSelected,
        visited,
        inRange: isSelected && inRange && visitStatus !== "cooldown",
      }),
    [poi, isSelected, visited, inRange, visitStatus]
  );

  const cooldownMs =
    visitStatus === "cooldown" && visit
      ? getCooldownRemainingMs(visit, poi.type, Date.now(), getTodayCooldownOptions(poi.type))
      : 0;

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
          {visitStatus === "landmark_done" ? (
            <p className="rpg-poi-bubble__prompt text-emerald-300">Explored</p>
          ) : visitStatus === "cooldown" ? (
            <p className="rpg-poi-bubble__prompt text-slate-400">
              Resets in {formatCooldownRemaining(cooldownMs)}
            </p>
          ) : visitStatus === "ready" ? (
            <p className="rpg-poi-bubble__prompt text-amber-200">Ready to explore again</p>
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
