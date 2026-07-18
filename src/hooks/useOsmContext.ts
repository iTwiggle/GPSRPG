"use client";

import { useEffect, useMemo, useState } from "react";
import {
  cellKeyToString,
  getAreaCellKey,
  getAreaFlavorLabel,
  getCachedOsmResult,
  resolveOsmContext,
  type NamedOsmPlace,
  type OsmContextCategory,
} from "@/lib/osm-context";

export type OsmContextStatus = "idle" | "loading" | "ready" | "error";

export interface UseOsmContextResult {
  category: OsmContextCategory;
  status: OsmContextStatus;
  areaFlavorLabel: string | null;
  /** Named OSM landmark for the dominant category, when Overpass found one. */
  place: NamedOsmPlace | null;
  placeName: string | null;
  cellKey: ReturnType<typeof getAreaCellKey> | null;
  /** True once Overpass resolved, failed, or a cache hit — safe to finalize the field. */
  isSettled: boolean;
}

export function useOsmContext(
  lat: number | undefined,
  lng: number | undefined
): UseOsmContextResult {
  const cellKey = useMemo(() => {
    if (lat === undefined || lng === undefined) return null;
    return getAreaCellKey(lat, lng);
  }, [lat, lng]);

  const cellKeyString = cellKey ? cellKeyToString(cellKey) : null;

  const [status, setStatus] = useState<OsmContextStatus>("idle");
  const [category, setCategory] = useState<OsmContextCategory>("generic");
  const [place, setPlace] = useState<NamedOsmPlace | null>(null);

  useEffect(() => {
    if (!cellKey || !cellKeyString) {
      setStatus("idle");
      setCategory("generic");
      setPlace(null);
      return;
    }

    const cached = getCachedOsmResult(cellKey);
    if (cached) {
      setCategory(cached.category);
      setPlace(cached.place ?? null);
      setStatus("ready");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setCategory("generic");
    setPlace(null);

    resolveOsmContext(cellKey)
      .then((result) => {
        if (cancelled) return;
        setCategory(result.category);
        setPlace(result.place ?? null);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setCategory("generic");
        setPlace(null);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [cellKey, cellKeyString]);

  const areaFlavorLabel = useMemo(() => {
    if (status !== "ready" || category === "generic") {
      return null;
    }
    return getAreaFlavorLabel(category);
  }, [category, status]);

  const isSettled = status === "ready" || status === "error";

  return {
    category,
    status,
    areaFlavorLabel,
    place,
    placeName: place?.name ?? null,
    cellKey,
    isSettled,
  };
}
