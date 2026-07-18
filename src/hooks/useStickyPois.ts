"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { generateNearbyPOIs } from "@/lib/poi-generator";
import {
  type PoiAnchorState,
  contextUpgradeNeedsRefresh,
  createPoiAnchor,
  metersUntilPoiRefresh,
  readPoiAnchor,
  shouldRegeneratePoiAnchor,
  shouldReplaceStaleAnchorOnStartup,
  writePoiAnchor,
} from "@/lib/poi-anchor";
import type { NamedOsmPlace, OsmContextCategory } from "@/lib/osm-context";
import type { POI, Position } from "@/lib/types";

export interface StickyOsmInput {
  category: OsmContextCategory;
  place: NamedOsmPlace | null;
  /** Wait for Overpass before creating a brand-new field. */
  isSettled: boolean;
}

interface UseStickyPoisResult {
  pois: POI[];
  anchor: PoiAnchorState | null;
  metersUntilRefresh: number | null;
  /** True while waiting on Overpass before the first field can be finalized. */
  awaitingPlaceContext: boolean;
}

function readInitialAnchor(): PoiAnchorState | null {
  if (typeof window === "undefined") return null;
  return readPoiAnchor();
}

function fieldHasExploredSites(
  anchor: PoiAnchorState,
  visitedPoiIds: readonly string[]
): boolean {
  if (visitedPoiIds.length === 0) return false;
  const pois = generateNearbyPOIs(anchor.lat, anchor.lng, {
    areaContext: anchor.areaContext,
    placeAnchored: Boolean(anchor.placeAnchored),
    approachFrom:
      typeof anchor.playerLat === "number" &&
      typeof anchor.playerLng === "number"
        ? { lat: anchor.playerLat, lng: anchor.playerLng }
        : null,
  });
  return pois.some((poi) => visitedPoiIds.includes(poi.id));
}

export function useStickyPois(
  playerPosition: Position | null,
  osm: StickyOsmInput,
  visitedPoiIds: readonly string[] = []
): UseStickyPoisResult {
  const [anchor, setAnchor] = useState<PoiAnchorState | null>(readInitialAnchor);
  const startupAnchorResolved = useRef(false);
  const { category: areaContext, place, isSettled } = osm;

  useEffect(() => {
    if (!playerPosition || startupAnchorResolved.current) return;

    // Persist a previous field immediately; brand-new fields wait for Overpass.
    if (!anchor && !isSettled) {
      return;
    }

    startupAnchorResolved.current = true;

    if (!anchor) {
      const nextAnchor = createPoiAnchor(playerPosition, areaContext, place);
      setAnchor(nextAnchor);
      writePoiAnchor(nextAnchor);
      return;
    }

    if (shouldReplaceStaleAnchorOnStartup(playerPosition, anchor)) {
      // Prefer settled OSM so a cold start far away does not lock generic.
      if (!isSettled) {
        startupAnchorResolved.current = false;
        return;
      }
      const nextAnchor = createPoiAnchor(playerPosition, areaContext, place);
      setAnchor(nextAnchor);
      writePoiAnchor(nextAnchor);
    }
  }, [anchor, areaContext, isSettled, place, playerPosition]);

  // Walk far enough → new field keyed to current place context.
  useEffect(() => {
    if (!playerPosition || !startupAnchorResolved.current || !anchor) return;
    if (!isSettled) return;
    if (!shouldRegeneratePoiAnchor(playerPosition, anchor)) return;

    const nextAnchor = createPoiAnchor(playerPosition, areaContext, place);
    if (
      nextAnchor.lat === anchor.lat &&
      nextAnchor.lng === anchor.lng &&
      nextAnchor.areaContext === anchor.areaContext &&
      nextAnchor.placeName === anchor.placeName &&
      nextAnchor.placeId === anchor.placeId &&
      Boolean(nextAnchor.placeAnchored) === Boolean(anchor.placeAnchored)
    ) {
      return;
    }

    setAnchor(nextAnchor);
    writePoiAnchor(nextAnchor);
  }, [anchor, areaContext, isSettled, place, playerPosition]);

  // Overpass upgraded mood/place before the player explored — re-key the field.
  useEffect(() => {
    if (!playerPosition || !startupAnchorResolved.current || !anchor) return;
    if (!isSettled) return;
    if (!contextUpgradeNeedsRefresh(anchor, areaContext, place)) return;
    if (fieldHasExploredSites(anchor, visitedPoiIds)) return;

    const nextAnchor = createPoiAnchor(playerPosition, areaContext, place);
    if (
      nextAnchor.lat === anchor.lat &&
      nextAnchor.lng === anchor.lng &&
      nextAnchor.areaContext === anchor.areaContext &&
      nextAnchor.placeName === anchor.placeName &&
      nextAnchor.placeId === anchor.placeId &&
      Boolean(nextAnchor.placeAnchored) === Boolean(anchor.placeAnchored)
    ) {
      return;
    }

    setAnchor(nextAnchor);
    writePoiAnchor(nextAnchor);
  }, [
    anchor,
    areaContext,
    isSettled,
    place,
    playerPosition,
    visitedPoiIds,
  ]);

  const resolvedAnchor = anchor;

  const pois = useMemo(() => {
    if (!resolvedAnchor) return [];
    return generateNearbyPOIs(resolvedAnchor.lat, resolvedAnchor.lng, {
      areaContext: resolvedAnchor.areaContext,
      placeAnchored: Boolean(resolvedAnchor.placeAnchored),
      approachFrom:
        typeof resolvedAnchor.playerLat === "number" &&
        typeof resolvedAnchor.playerLng === "number"
          ? {
              lat: resolvedAnchor.playerLat,
              lng: resolvedAnchor.playerLng,
            }
          : null,
    });
  }, [resolvedAnchor]);

  const metersUntilRefresh =
    playerPosition && resolvedAnchor
      ? metersUntilPoiRefresh(playerPosition, resolvedAnchor)
      : null;

  const awaitingPlaceContext =
    Boolean(playerPosition) && !resolvedAnchor && !isSettled;

  return {
    pois,
    anchor: resolvedAnchor,
    metersUntilRefresh,
    awaitingPlaceContext,
  };
}
