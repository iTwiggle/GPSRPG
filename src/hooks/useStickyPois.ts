"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { generateNearbyPOIs } from "@/lib/poi-generator";
import {
  type PoiAnchorState,
  createPoiAnchor,
  metersUntilPoiRefresh,
  readPoiAnchor,
  shouldRegeneratePoiAnchor,
  shouldReplaceStaleAnchorOnStartup,
  writePoiAnchor,
} from "@/lib/poi-anchor";
import type { OsmContextCategory } from "@/lib/osm-context";
import type { POI, Position } from "@/lib/types";

interface UseStickyPoisResult {
  pois: POI[];
  anchor: PoiAnchorState | null;
  metersUntilRefresh: number | null;
}

function readInitialAnchor(): PoiAnchorState | null {
  if (typeof window === "undefined") return null;
  return readPoiAnchor();
}

export function useStickyPois(
  playerPosition: Position | null,
  areaContext: OsmContextCategory
): UseStickyPoisResult {
  const [anchor, setAnchor] = useState<PoiAnchorState | null>(readInitialAnchor);
  const startupAnchorResolved = useRef(false);

  useEffect(() => {
    if (!playerPosition || startupAnchorResolved.current) return;

    startupAnchorResolved.current = true;

    if (!anchor) {
      const nextAnchor = createPoiAnchor(playerPosition, areaContext);
      setAnchor(nextAnchor);
      writePoiAnchor(nextAnchor);
      return;
    }

    if (shouldReplaceStaleAnchorOnStartup(playerPosition, anchor)) {
      const nextAnchor = createPoiAnchor(playerPosition, areaContext);
      setAnchor(nextAnchor);
      writePoiAnchor(nextAnchor);
    }
  }, [anchor, areaContext, playerPosition]);

  useEffect(() => {
    if (!playerPosition || !startupAnchorResolved.current || !anchor) return;

    if (!shouldRegeneratePoiAnchor(playerPosition, anchor)) return;

    const nextAnchor = createPoiAnchor(playerPosition, areaContext);
    if (
      nextAnchor.lat === anchor.lat &&
      nextAnchor.lng === anchor.lng &&
      nextAnchor.areaContext === anchor.areaContext
    ) {
      return;
    }

    setAnchor(nextAnchor);
    writePoiAnchor(nextAnchor);
  }, [anchor, areaContext, playerPosition]);

  const resolvedAnchor = anchor;

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
