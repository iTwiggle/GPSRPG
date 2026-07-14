"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Popup, Circle, useMap } from "react-leaflet";
import AccessibleMarker from "@/components/AccessibleMarker";
import ExplorationFogOverlay from "@/components/ExplorationFogOverlay";
import FantasyAtlasOverlay from "@/components/FantasyAtlasOverlay";
import FantasyTerrainOverlay from "@/components/FantasyTerrainOverlay";
import surfaceStyles from "@/components/FantasyMapSurface.module.css";
import { getApproachReadout } from "@/lib/approach";
import { formatDistance } from "@/lib/distance";
import { getPoiTypeLabel } from "@/lib/poi-flavor";
import {
  createPoiMarkerConfig,
  playerMarkerConfig,
} from "@/lib/poi-marker-icons";
import type { POI } from "@/lib/types";
import { EXPLORE_RADIUS_METERS } from "@/lib/types";

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);

  return null;
}

interface GameMapProps {
  playerLat: number;
  playerLng: number;
  pois: POI[];
  selectedPoiId: string | null;
  visitedPoiIds: string[];
  revealedCellKeys: string[];
  fantasyGridEnabled: boolean;
  streetReferenceMode: boolean;
  onInteractPoi: (poi: POI) => void;
}

export default function GameMap({
  playerLat,
  playerLng,
  pois,
  selectedPoiId,
  visitedPoiIds,
  revealedCellKeys,
  fantasyGridEnabled,
  streetReferenceMode,
  onInteractPoi,
}: GameMapProps) {
  const center = useMemo(
    () => [playerLat, playerLng] as [number, number],
    [playerLat, playerLng]
  );

  const mapClassName = [
    "fantasy-map-surface h-full w-full",
    surfaceStyles.atlasSurface,
    fantasyGridEnabled && surfaceStyles.atlasActive,
    streetReferenceMode && surfaceStyles.streetReference,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <MapContainer
      center={center}
      zoom={16}
      className={mapClassName}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FantasyTerrainOverlay
        enabled={fantasyGridEnabled}
        streetReference={streetReferenceMode}
      />
      <FantasyAtlasOverlay
        enabled={fantasyGridEnabled}
        streetReference={streetReferenceMode}
        playerLat={playerLat}
        playerLng={playerLng}
        revealedCellKeys={revealedCellKeys}
      />
      <ExplorationFogOverlay
        enabled={fantasyGridEnabled && !streetReferenceMode}
        playerLat={playerLat}
        playerLng={playerLng}
        revealedCellKeys={revealedCellKeys}
      />
      <RecenterMap lat={playerLat} lng={playerLng} />

      <AccessibleMarker
        position={center}
        icon={playerMarkerConfig.icon}
        accessibility={playerMarkerConfig.accessibility}
      >
        <Popup>You are here</Popup>
      </AccessibleMarker>

      <Circle
        center={center}
        radius={EXPLORE_RADIUS_METERS}
        pane="markerPane"
        interactive={false}
        pathOptions={{
          stroke: false,
          fill: true,
          fillColor: "#60a5fa",
          fillOpacity: 0.2,
          className: surfaceStyles.exploreRadius,
        }}
      />

      {pois.map((poi) => {
        const visited = visitedPoiIds.includes(poi.id);
        const readout = getApproachReadout(
          { lat: playerLat, lng: playerLng },
          poi,
          EXPLORE_RADIUS_METERS
        );
        const isSelected = poi.id === selectedPoiId;
        const inRange = readout.status === "in_range";
        const markerConfig = createPoiMarkerConfig(poi, {
          selected: isSelected,
          visited,
          inRange: isSelected && inRange,
        });

        return (
          <AccessibleMarker
            key={poi.id}
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
      })}
    </MapContainer>
  );
}
