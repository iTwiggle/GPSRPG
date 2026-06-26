"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import type { POI } from "@/lib/types";
import { EXPLORE_RADIUS_METERS } from "@/lib/types";
import { distanceMeters, formatDistance } from "@/lib/distance";

const playerIcon = L.divIcon({
  className: "player-marker",
  html: '<div class="player-marker-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const poiIcon = L.divIcon({
  className: "poi-marker",
  html: '<div class="poi-marker-dot"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const visitedPoiIcon = L.divIcon({
  className: "poi-marker visited",
  html: '<div class="poi-marker-dot visited"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

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
      className="h-full w-full rounded-xl"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap lat={playerLat} lng={playerLng} />

      <Marker position={center} icon={playerIcon}>
        <Popup>You are here</Popup>
      </Marker>

      <Circle
        center={center}
        radius={EXPLORE_RADIUS_METERS}
        pathOptions={{
          color: "#6366f1",
          fillColor: "#6366f1",
          fillOpacity: 0.08,
          weight: 1,
        }}
      />

      {pois.map((poi) => {
        const visited = visitedPoiIds.includes(poi.id);
        const dist = distanceMeters(
          { lat: playerLat, lng: playerLng },
          { lat: poi.lat, lng: poi.lng }
        );
        const isSelected = poi.id === selectedPoiId;

        return (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            icon={visited ? visitedPoiIcon : poiIcon}
            eventHandlers={{
              click: () => onSelectPoi(poi),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{poi.name}</p>
                <p className="capitalize text-slate-600">{poi.type}</p>
                <p>{formatDistance(dist)} away</p>
                {visited && <p className="text-emerald-600">Visited</p>}
                {isSelected && <p className="text-indigo-600">Selected</p>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
