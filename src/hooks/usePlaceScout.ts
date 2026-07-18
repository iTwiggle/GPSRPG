"use client";

import { useEffect, useMemo, useState } from "react";
import {
  cellKeyToString,
  getAreaCellKey,
  getCachedOsmResult,
  resolveOsmContext,
  type NamedOsmPlace,
} from "@/lib/osm-context";
import {
  buildScoutReadout,
  pickScoutTarget,
  type ScoutReadout,
} from "@/lib/place-scout";
import type { Position } from "@/lib/types";

export interface UsePlaceScoutResult {
  scout: ScoutReadout | null;
  scoutPlaces: NamedOsmPlace[];
  selectedScoutPlaceId: string | null;
  selectScoutPlace: (placeId: string | null) => void;
}

function mergePlaces(
  ...lists: Array<readonly NamedOsmPlace[] | undefined>
): NamedOsmPlace[] {
  const byId = new Map<string, NamedOsmPlace>();
  for (const list of lists) {
    if (!list) continue;
    for (const place of list) {
      if (!byId.has(place.id)) {
        byId.set(place.id, place);
      }
    }
  }
  return [...byId.values()];
}

/**
 * Destination curiosity: pan/focus a named place the player hasn't footfalled
 * yet → spoiler-safe scanner teaser.
 */
export function usePlaceScout(options: {
  player: Position | null;
  mapFocus: Position | null;
  localPlaces: readonly NamedOsmPlace[];
  discoveredPlaceIds: readonly string[];
  activePlaceId?: string | null;
}): UsePlaceScoutResult {
  const {
    player,
    mapFocus,
    localPlaces,
    discoveredPlaceIds,
    activePlaceId = null,
  } = options;

  const [focusPlaces, setFocusPlaces] = useState<NamedOsmPlace[]>([]);
  const [selectedScoutPlaceId, setSelectedScoutPlaceId] = useState<
    string | null
  >(null);

  const focusCellKey = useMemo(() => {
    if (!mapFocus) return null;
    return getAreaCellKey(mapFocus.lat, mapFocus.lng);
  }, [mapFocus]);

  const focusCellKeyString = focusCellKey
    ? cellKeyToString(focusCellKey)
    : null;

  useEffect(() => {
    if (!focusCellKey || !focusCellKeyString) {
      setFocusPlaces([]);
      return;
    }

    const cached = getCachedOsmResult(focusCellKey);
    if (cached) {
      setFocusPlaces(cached.places ?? (cached.place ? [cached.place] : []));
      return;
    }

    let cancelled = false;
    resolveOsmContext(focusCellKey)
      .then((result) => {
        if (cancelled) return;
        setFocusPlaces(result.places ?? (result.place ? [result.place] : []));
      })
      .catch(() => {
        if (cancelled) return;
        setFocusPlaces([]);
      });

    return () => {
      cancelled = true;
    };
  }, [focusCellKey, focusCellKeyString]);

  const scoutPlaces = useMemo(
    () => mergePlaces(localPlaces, focusPlaces),
    [focusPlaces, localPlaces]
  );

  const autoTarget = useMemo(() => {
    if (!player || !mapFocus) return null;
    return pickScoutTarget({
      player,
      focus: mapFocus,
      candidates: scoutPlaces,
      discoveredPlaceIds,
      activePlaceId,
    });
  }, [activePlaceId, discoveredPlaceIds, mapFocus, player, scoutPlaces]);

  // Keep an explicit tap selection if still valid; otherwise follow map focus.
  const activeScoutPlace = useMemo(() => {
    if (selectedScoutPlaceId) {
      const selected = scoutPlaces.find(
        (place) => place.id === selectedScoutPlaceId
      );
      if (
        selected &&
        player &&
        !discoveredPlaceIds.includes(selected.id) &&
        selected.id !== activePlaceId
      ) {
        return selected;
      }
    }
    return autoTarget;
  }, [
    activePlaceId,
    autoTarget,
    discoveredPlaceIds,
    player,
    scoutPlaces,
    selectedScoutPlaceId,
  ]);

  const scout = useMemo(() => {
    if (!player || !activeScoutPlace) return null;
    return buildScoutReadout(activeScoutPlace, player);
  }, [activeScoutPlace, player]);

  return {
    scout,
    scoutPlaces,
    selectedScoutPlaceId: activeScoutPlace?.id ?? null,
    selectScoutPlace: setSelectedScoutPlaceId,
  };
}
