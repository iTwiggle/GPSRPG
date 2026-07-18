"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import FantasyGridOverlay from "@/components/FantasyGridOverlay";
import { getApproachReadout } from "@/lib/approach";
import { formatDistance } from "@/lib/distance";
import { mapCategoryToBiome } from "@/lib/fantasy-grid-surface";
import {
  getPoiDisplayName,
  getPoiDisplayTypeLabel,
  isPoiRevealed,
} from "@/lib/poi-reveal";
import { createPoiMarkerIcon, playerMarkerIcon } from "@/lib/poi-marker-icons";
import type { OsmContextCategory } from "@/lib/osm-context";
import type { POI } from "@/lib/types";
import { EXPLORE_RADIUS_METERS } from "@/lib/types";

function RecenterMap({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
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
  areaContext: OsmContextCategory;
  placeName?: string | null;
  fantasyGridEnabled: boolean;
  streetReferenceMode: boolean;
  onSelectPoi: (poi: POI) => void;
}

export default function GameMap({
  playerLat,
  playerLng,
  pois,
  selectedPoiId,
  visitedPoiIds,
  areaContext,
  placeName = null,
  fantasyGridEnabled,
  streetReferenceMode,
  onSelectPoi,
}: GameMapProps) {
  const center = useMemo(
    () => [playerLat, playerLng] as [number, number],
    [playerLat, playerLng]
  );

  const surfaceBiome = useMemo(
    () => mapCategoryToBiome(areaContext),
    [areaContext]
  );

  const mapClassName = [
    "fantasy-map-surface h-full w-full rounded-xl",
    fantasyGridEnabled && "fantasy-map-surface--grid-active",
    streetReferenceMode && "fantasy-map-surface--street-ref",
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
      <FantasyGridOverlay
        biome={surfaceBiome}
        enabled={fantasyGridEnabled}
        streetReference={streetReferenceMode}
      />
      <RecenterMap lat={playerLat} lng={playerLng} />

      <Marker position={center} icon={playerMarkerIcon}>
        <Popup>You are here</Popup>
      </Marker>

      <Circle
        center={center}
        radius={EXPLORE_RADIUS_METERS}
        pathOptions={{
          color: "#a78bfa",
          fillColor: "#7c3aed",
          fillOpacity: 0.1,
          weight: 1.5,
          dashArray: "4 6",
        }}
      />

      {pois.map((poi) => {
        const visited = visitedPoiIds.includes(poi.id);
        const revealed = isPoiRevealed(poi.id, visitedPoiIds);
        const readout = getApproachReadout(
          { lat: playerLat, lng: playerLng },
          poi,
          EXPLORE_RADIUS_METERS
        );
        const isSelected = poi.id === selectedPoiId;
        const inRange = readout.status === "in_range";
        const displayName = getPoiDisplayName(poi, revealed, areaContext);
        const displayType = getPoiDisplayTypeLabel(poi, revealed);

        return (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            icon={createPoiMarkerIcon(poi.type, {
              selected: isSelected,
              visited,
              veiled: !revealed,
              inRange: isSelected && inRange,
            })}
            eventHandlers={{
              click: () => onSelectPoi(poi),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-slate-100">{displayName}</p>
                <p className="text-violet-300">{displayType}</p>
                {placeName && !revealed && (
                  <p className="text-xs text-slate-400">Near {placeName}</p>
                )}
                <p className="text-slate-400">
                  {formatDistance(readout.distanceMeters)} away
                </p>
                {visited && (
                  <p className="text-emerald-400">Already explored</p>
                )}
                {!revealed && (
                  <p className="text-violet-300/80">Explore to reveal</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
