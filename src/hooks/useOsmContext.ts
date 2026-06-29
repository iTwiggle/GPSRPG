"use client";

import { useEffect, useMemo, useState } from "react";
import {
  cellKeyToString,
  getAreaCellKey,
  getAreaFlavorLabel,
  getCachedOsmCategory,
  resolveOsmContext,
  type OsmContextCategory,
} from "@/lib/osm-context";

export type OsmContextStatus = "idle" | "loading" | "ready" | "error";

export interface UseOsmContextResult {
  category: OsmContextCategory;
  status: OsmContextStatus;
  areaFlavorLabel: string | null;
  cellKey: ReturnType<typeof getAreaCellKey> | null;
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

  useEffect(() => {
    if (!cellKey || !cellKeyString) {
      setStatus("idle");
      setCategory("generic");
      return;
    }

    const cachedCategory = getCachedOsmCategory(cellKey);
    if (cachedCategory) {
      setCategory(cachedCategory);
      setStatus("ready");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setCategory("generic");

    resolveOsmContext(cellKey)
      .then((result) => {
        if (cancelled) return;
        setCategory(result.category);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setCategory("generic");
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

  return {
    category,
    status,
    areaFlavorLabel,
    cellKey,
  };
}
