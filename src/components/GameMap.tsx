"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import FantasyGridOverlay from "@/components/FantasyGridOverlay";
import { getApproachReadout } from "@/lib/approach";
import { distanceMeters, formatDistance } from "@/lib/distance";
import { mapCategoryToBiome } from "@/lib/fantasy-grid-surface";
import {
  getPoiDisplayName,
  getPoiDisplayTypeLabel,
  isPoiRevealed,
} from "@/lib/poi-reveal";
import { createPoiMarkerIcon, playerMarkerIcon } from "@/lib/poi-marker-icons";
import type { NamedOsmPlace, OsmContextCategory } from "@/lib/osm-context";
import type { ScoutReadout } from "@/lib/place-scout";
import type { POI, Position } from "@/lib/types";
import { EXPLORE_RADIUS_METERS } from "@/lib/types";

/** Only re-snap the camera when the player moves this far — lets pan-to-scout work. */
const RECENTER_MOVE_METERS = 45;

function RecenterMap({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  const map = useMap();
  const lastCenter = useRef<Position | null>(null);

  useEffect(() => {
    if (!lastCenter.current) {
      map.setView([lat, lng], map.getZoom(), { animate: false });
      lastCenter.current = { lat, lng };
      return;
    }

    const moved = distanceMeters(lastCenter.current, { lat, lng });
    if (moved >= RECENTER_MOVE_METERS) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
      lastCenter.current = { lat, lng };
    }
  }, [lat, lng, map]);

  return null;
}

function MapFocusReporter({
  onFocusChange,
}: {
  onFocusChange: (focus: Position) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const center = map.getCenter();
    onFocusChange({ lat: center.lat, lng: center.lng });
  }, [map, onFocusChange]);

  useMapEvents({
    moveend: (event) => {
      const center = event.target.getCenter();
      onFocusChange({ lat: center.lat, lng: center.lng });
    },
  });

  return null;
}

function createDestinationIcon(selected: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div style="
      width:22px;height:22px;border-radius:9999px;
      border:2px solid ${selected ? "#fbbf24" : "#a78bfa"};
      background:${selected ? "rgba(251,191,36,0.35)" : "rgba(124,58,237,0.28)"};
      box-shadow:0 0 12px ${selected ? "rgba(251,191,36,0.45)" : "rgba(124,58,237,0.35)"};
    "></div>`,
  });
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
  scoutPlaces?: NamedOsmPlace[];
  scout?: ScoutReadout | null;
  selectedScoutPlaceId?: string | null;
  onSelectScoutPlace?: (place: NamedOsmPlace) => void;
  onMapFocusChange?: (focus: Position) => void;
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
  scoutPlaces = [],
  scout = null,
  selectedScoutPlaceId = null,
  onSelectScoutPlace,
  onMapFocusChange,
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
      {onMapFocusChange && <MapFocusReporter onFocusChange={onMapFocusChange} />}

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

      {scoutPlaces.map((place) => {
        const isSelected = place.id === selectedScoutPlaceId;
        return (
          <Marker
            key={`scout-${place.id}`}
            position={[place.lat, place.lng]}
            icon={createDestinationIcon(isSelected)}
            eventHandlers={{
              click: () => onSelectScoutPlace?.(place),
            }}
            zIndexOffset={isSelected ? 600 : 400}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-slate-100">{place.name}</p>
                <p className="text-violet-300">Uncharted place</p>
                {scout && scout.place.id === place.id && (
                  <p className="mt-1 text-xs text-amber-200/90">
                    {scout.headline}
                  </p>
                )}
                <p className="text-slate-400">
                  {formatDistance(
                    distanceMeters(
                      { lat: playerLat, lng: playerLng },
                      place
                    )
                  )}{" "}
                  away
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}

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
