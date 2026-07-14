"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Popup, Circle, useMap } from "react-leaflet";
import AccessibleMarker from "@/components/AccessibleMarker";
import ExplorationFogOverlay from "@/components/ExplorationFogOverlay";
import FantasyAtlasOverlay from "@/components/FantasyAtlasOverlay";
import FantasyTerrainOverlay from "@/components/FantasyTerrainOverlay";
import PoiMapMarker from "@/components/PoiMapMarker";
import surfaceStyles from "@/components/FantasyMapSurface.module.css";
import {
  playerMarkerConfig,
} from "@/lib/poi-marker-icons";
import type { POI } from "@/lib/types";
import { EXPLORE_RADIUS_METERS } from "@/lib/types";

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const lastCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const last = lastCenterRef.current;
    if (last && last.lat === lat && last.lng === lng) return;

    lastCenterRef.current = { lat, lng };
    map.setView([lat, lng], map.getZoom(), { animate: false });
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

  const visitedSet = useMemo(() => new Set(visitedPoiIds), [visitedPoiIds]);

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

      {pois.map((poi) => (
        <PoiMapMarker
          key={poi.id}
          poi={poi}
          visited={visitedSet.has(poi.id)}
          isSelected={poi.id === selectedPoiId}
          playerLat={playerLat}
          playerLng={playerLng}
          onInteractPoi={onInteractPoi}
        />
      ))}
    </MapContainer>
  );
}
