"use client";

import { useEffect, useMemo, useState } from "react";
import { generateNearbyPOIs } from "@/lib/poi-generator";
import {
  type PoiAnchorState,
  metersUntilPoiRefresh,
  readPoiAnchor,
  shouldRegeneratePoiAnchor,
  writePoiAnchor,
} from "@/lib/poi-anchor";
import type { OsmContextCategory } from "@/lib/osm-context";
import type { POI, Position } from "@/lib/types";

interface UseStickyPoisResult {
  pois: POI[];
  anchor: PoiAnchorState | null;
  metersUntilRefresh: number | null;
}

export function useStickyPois(
  playerPosition: Position | null,
  areaContext: OsmContextCategory
): UseStickyPoisResult {
  const [anchor, setAnchor] = useState<PoiAnchorState | null>(null);

  useEffect(() => {
    const stored = readPoiAnchor();
    if (stored) {
      setAnchor(stored);
    }
  }, []);

  const resolvedAnchor = useMemo(() => {
    if (!playerPosition) return null;

    if (shouldRegeneratePoiAnchor(playerPosition, anchor)) {
      const nextAnchor: PoiAnchorState = {
        lat: playerPosition.lat,
        lng: playerPosition.lng,
        areaContext,
      };
      return nextAnchor;
    }

    return anchor;
  }, [anchor, areaContext, playerPosition]);

  useEffect(() => {
    if (!resolvedAnchor) return;

    const changed =
      !anchor ||
      anchor.lat !== resolvedAnchor.lat ||
      anchor.lng !== resolvedAnchor.lng ||
      anchor.areaContext !== resolvedAnchor.areaContext;

    if (changed) {
      setAnchor(resolvedAnchor);
      writePoiAnchor(resolvedAnchor);
    }
  }, [anchor, resolvedAnchor]);

  const pois = useMemo(() => {
    if (!resolvedAnchor) return [];
    return generateNearbyPOIs(resolvedAnchor.lat, resolvedAnchor.lng, {
      areaContext: resolvedAnchor.areaContext,
    });
  }, [resolvedAnchor]);

  const metersUntilRefresh =
    playerPosition && resolvedAnchor
      ? metersUntilPoiRefresh(playerPosition, resolvedAnchor)
      : null;

  return {
    pois,
    anchor: resolvedAnchor,
    metersUntilRefresh,
  };
}
