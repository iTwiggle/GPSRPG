"use client";

import { useEffect, useMemo, useState } from "react";
import { distanceMeters } from "@/lib/distance";
import { cellKeyToString, getAreaCellKey, type OsmContextCategory } from "@/lib/osm-context";
import { generateNearbyPOIs } from "@/lib/poi-generator";
import type { POI, Position } from "@/lib/types";
import {
  buildWorldPoiField,
  WORLD_POI_ACTIVE_RADIUS_METERS,
} from "@/lib/world-poi-field";

const ONBOARDING_POI_STORAGE_KEY = "gpsrpg-onboarding-poi-v1";

interface UseStickyPoisResult {
  pois: POI[];
}

function isStoredPoi(value: unknown): value is POI {
  if (!value || typeof value !== "object") return false;
  const poi = value as Partial<POI>;
  return (
    typeof poi.id === "string" &&
    typeof poi.name === "string" &&
    typeof poi.type === "string" &&
    typeof poi.flavor === "string" &&
    typeof poi.lat === "number" &&
    typeof poi.lng === "number"
  );
}

function readOnboardingPoi(): POI | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_POI_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isStoredPoi(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function createOnboardingPoi(
  playerPosition: Position,
  areaContext: OsmContextCategory
): POI {
  const generated = generateNearbyPOIs(
    playerPosition.lat,
    playerPosition.lng,
    { count: 1, areaContext }
  )[0];
  const cellKey = cellKeyToString(
    getAreaCellKey(playerPosition.lat, playerPosition.lng)
  );

  return {
    ...generated,
    id: `starter-${cellKey}`,
  };
}

function writeOnboardingPoi(poi: POI): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ONBOARDING_POI_STORAGE_KEY, JSON.stringify(poi));
  } catch {
    // The rolling world field still works if onboarding persistence is blocked.
  }
}

export function useStickyPois(
  playerPosition: Position | null,
  areaContext: OsmContextCategory
): UseStickyPoisResult {
  const [onboardingPoi, setOnboardingPoi] = useState<POI | null>(
    readOnboardingPoi
  );

  useEffect(() => {
    if (!playerPosition || onboardingPoi) return;
    const next = createOnboardingPoi(playerPosition, areaContext);
    setOnboardingPoi(next);
    writeOnboardingPoi(next);
  }, [areaContext, onboardingPoi, playerPosition]);

  const pois = useMemo(() => {
    if (!playerPosition) return [];

    const worldPois = buildWorldPoiField(playerPosition, areaContext);
    if (
      !onboardingPoi ||
      distanceMeters(playerPosition, onboardingPoi) >
        WORLD_POI_ACTIVE_RADIUS_METERS ||
      worldPois.some((poi) => poi.id === onboardingPoi.id)
    ) {
      return worldPois;
    }

    return [...worldPois, onboardingPoi].sort(
      (a, b) =>
        distanceMeters(playerPosition, a) -
        distanceMeters(playerPosition, b)
    );
  }, [areaContext, onboardingPoi, playerPosition]);

  return { pois };
}
