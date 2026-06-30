"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { getApproachReadout } from "@/lib/approach";
import { formatDistance } from "@/lib/distance";
import { getPoiTypeLabel } from "@/lib/poi-flavor";
import { createPoiMarkerIcon, playerMarkerIcon } from "@/lib/poi-marker-icons";
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
  onSelectPoi: (poi: POI) => void;
}

export default function GameMap({
  playerLat,
  playerLng,
  pois,
  selectedPoiId,
  visitedPoiIds,
  onSelectPoi,
}: GameMapProps) {
  const center = useMemo(
    () => [playerLat, playerLng] as [number, number],
    [playerLat, playerLng]
  );

  return (
    <MapContainer
      center={center}
      zoom={16}
      className="fantasy-map-surface h-full w-full rounded-xl"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
        const readout = getApproachReadout(
          { lat: playerLat, lng: playerLng },
          poi,
          EXPLORE_RADIUS_METERS
        );
        const isSelected = poi.id === selectedPoiId;
        const inRange = readout.status === "in_range";

        return (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            icon={createPoiMarkerIcon(poi.type, {
              selected: isSelected,
              visited,
              inRange: isSelected && inRange,
            })}
            eventHandlers={{
              click: () => onSelectPoi(poi),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-slate-100">{poi.name}</p>
                <p className="text-violet-300">{getPoiTypeLabel(poi.type)}</p>
                <p className="text-slate-400">
                  {formatDistance(readout.distanceMeters)} away
                </p>
                {visited && (
                  <p className="text-emerald-400">Already explored</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
