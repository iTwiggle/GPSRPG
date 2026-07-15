"use client";

import { memo, useEffect, useMemo } from "react";
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
import type { POI, VisitedPoiState } from "@/lib/types";
import { EXPLORE_RADIUS_METERS } from "@/lib/types";
import { getPoiVisitUiStatus } from "@/lib/temporal/poi-cooldowns";
import { getTodayCooldownOptions } from "@/lib/temporal/world-modifier";

/**
 * Pan only when the player drifts toward the viewport edge. Small demo nudges
 * update the marker without moving the map — avoiding canvas redraw storms.
 */
function FollowPlayerViewport({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    const size = map.getSize();
    const point = map.latLngToContainerPoint([lat, lng]);
    const marginX = size.x * 0.2;
    const marginY = size.y * 0.2;

    if (
      point.x >= marginX &&
      point.x <= size.x - marginX &&
      point.y >= marginY &&
      point.y <= size.y - marginY
    ) {
      return;
    }

    map.setView([lat, lng], map.getZoom(), { animate: false });
  }, [lat, lng, map]);

  return null;
}

interface GameMapProps {
  playerLat: number;
  playerLng: number;
  pois: POI[];
  selectedPoiId: string | null;
  visitedPois: Record<string, VisitedPoiState>;
  revealedCellKeys: string[];
  fantasyGridEnabled: boolean;
  streetReferenceMode: boolean;
  onInteractPoi: (poi: POI) => void;
}

function GameMap({
  playerLat,
  playerLng,
  pois,
  selectedPoiId,
  visitedPois,
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
      <FollowPlayerViewport lat={playerLat} lng={playerLng} />

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
          visit={visitedPois[poi.id]}
          visitStatus={getPoiVisitUiStatus(
            visitedPois[poi.id],
            poi.type,
            Date.now(),
            getTodayCooldownOptions(poi.type)
          )}
          isSelected={poi.id === selectedPoiId}
          playerLat={playerLat}
          playerLng={playerLng}
          onInteractPoi={onInteractPoi}
        />
      ))}
    </MapContainer>
  );
}

export default memo(GameMap);
