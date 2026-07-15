"use client";

import L from "leaflet";
import { useLayoutEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { distanceMeters } from "@/lib/distance";
import {
  EXPLORATION_REVEAL_RADIUS_METERS,
  explorationCellKey,
  getExplorationCell,
} from "@/lib/exploration-memory";
import {
  getFantasyAtlasPlacements,
  type FantasyMapMotif,
  type FantasyMapPlacement,
} from "@/lib/fantasy-map-art";
import { positionOverlayCanvas } from "@/lib/map-overlay-canvas";
import { createOverlayRedrawScheduler } from "@/lib/map-overlay-scheduler";

const DETAIL_PANE_NAME = "fantasyAtlasPane";
const DETAIL_PANE_Z_INDEX = "350";
const HINT_PANE_NAME = "fantasyBiomeHintPane";
// Sparse biome hints remain readable over fog (550), while discovered POIs
// and the Wayfarer stay visually dominant in markerPane (600).
const HINT_PANE_Z_INDEX = "575";
const UNCHARTED_HINT_OPACITY = 0.46;
const BIOME_HINT_CHUNK_STRIDE = 3;

const MOTIF_ASSETS: Record<FantasyMapMotif, string> = {
  "tree-cluster": "/map-art/tree-cluster.svg",
  "grass-scrub": "/map-art/grass-scrub.svg",
  "rock-cluster": "/map-art/rock-cluster.svg",
  reeds: "/map-art/reeds.svg",
  "wave-mark": "/map-art/wave-mark.svg",
  "ruin-wall": "/map-art/ruin-wall.svg",
  "hamlet-roof": "/map-art/hamlet-roof.svg",
  "standing-stones": "/map-art/standing-stones.svg",
  "dead-tree": "/map-art/dead-tree.svg",
  "path-stones": "/map-art/path-stones.svg",
};

const MOTIF_SIZE_PX: Record<FantasyMapMotif, { width: number; height: number }> = {
  "tree-cluster": { width: 46, height: 52 },
  "grass-scrub": { width: 42, height: 28 },
  "rock-cluster": { width: 42, height: 32 },
  reeds: { width: 38, height: 34 },
  "wave-mark": { width: 48, height: 26 },
  "ruin-wall": { width: 50, height: 38 },
  "hamlet-roof": { width: 48, height: 40 },
  "standing-stones": { width: 42, height: 42 },
  "dead-tree": { width: 42, height: 50 },
  "path-stones": { width: 46, height: 38 },
};

interface AtlasVisibilityState {
  playerLat: number;
  playerLng: number;
  revealedCellKeys: string[];
  liveRevealRadiusMeters: number;
}

function positionCanvas(map: L.Map, canvas: HTMLCanvasElement, dpr: number) {
  const size = map.getSize();
  const topLeft = map.containerPointToLayerPoint(L.point(0, 0));
  positionOverlayCanvas(canvas, size, topLeft, dpr);
}

function zoomScale(zoom: number): number {
  return Math.min(1.55, Math.max(0.72, Math.pow(2, (zoom - 16) * 0.28)));
}

function isSparseBiomeHint(placement: FantasyMapPlacement): boolean {
  const [row, column, index] = placement.id.split(":").map(Number);
  return (
    index === 0 &&
    row % BIOME_HINT_CHUNK_STRIDE === 0 &&
    column % BIOME_HINT_CHUNK_STRIDE === 0
  );
}

function isPlacementRevealed(
  placement: FantasyMapPlacement,
  state: AtlasVisibilityState,
  revealedCellKeys: Set<string>
): boolean {
  if (
    distanceMeters({ lat: state.playerLat, lng: state.playerLng }, placement) <=
    state.liveRevealRadiusMeters * 1.15
  ) {
    return true;
  }

  return revealedCellKeys.has(
    explorationCellKey(getExplorationCell(placement))
  );
}

interface FantasyAtlasOverlayProps {
  enabled: boolean;
  streetReference: boolean;
  playerLat: number;
  playerLng: number;
  revealedCellKeys: string[];
  liveRevealRadiusMeters?: number;
}

export default function FantasyAtlasOverlay({
  enabled,
  streetReference,
  playerLat,
  playerLng,
  revealedCellKeys,
  liveRevealRadiusMeters = EXPLORATION_REVEAL_RADIUS_METERS,
}: FantasyAtlasOverlayProps) {
  const map = useMap();
  const detailCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const redrawRef = useRef<(() => void) | null>(null);
  const visibilityRef = useRef<AtlasVisibilityState>({
    playerLat,
    playerLng,
    revealedCellKeys,
    liveRevealRadiusMeters,
  });
  const positionSchedulerRef = useRef<ReturnType<
    typeof createOverlayRedrawScheduler
  > | null>(null);

  visibilityRef.current = { playerLat, playerLng, revealedCellKeys, liveRevealRadiusMeters };

  useLayoutEffect(() => {
    if (!enabled) {
      map.getPane(DETAIL_PANE_NAME)?.replaceChildren();
      map.getPane(HINT_PANE_NAME)?.replaceChildren();
      detailCanvasRef.current = null;
      hintCanvasRef.current = null;
      redrawRef.current = null;
      return;
    }

    const mapFrame = map.getContainer().closest(".rpg-map-frame");
    const scannerOverlay = mapFrame?.querySelector<HTMLElement>(
      ".rpg-scanner-overlay"
    );
    const previousScannerDisplay = scannerOverlay?.style.display ?? "";
    if (scannerOverlay) scannerOverlay.style.display = "none";

    let detailPane = map.getPane(DETAIL_PANE_NAME);
    if (!detailPane) detailPane = map.createPane(DETAIL_PANE_NAME);
    detailPane.style.zIndex = DETAIL_PANE_Z_INDEX;
    detailPane.style.pointerEvents = "none";

    let hintPane = map.getPane(HINT_PANE_NAME);
    if (!hintPane) hintPane = map.createPane(HINT_PANE_NAME);
    hintPane.style.zIndex = HINT_PANE_Z_INDEX;
    hintPane.style.pointerEvents = "none";

    const detailCanvas = document.createElement("canvas");
    detailCanvas.className = "fantasy-atlas-canvas";
    detailCanvas.setAttribute("aria-hidden", "true");
    detailPane.replaceChildren(detailCanvas);
    detailCanvasRef.current = detailCanvas;

    const hintCanvas = document.createElement("canvas");
    hintCanvas.className = "fantasy-atlas-canvas fantasy-biome-hint-canvas";
    hintCanvas.setAttribute("aria-hidden", "true");
    hintPane.replaceChildren(hintCanvas);
    hintCanvasRef.current = hintCanvas;

    const images = new Map<FantasyMapMotif, HTMLImageElement>();
    let active = true;

    const drawNow = () => {
      const detailEl = detailCanvasRef.current;
      const hintEl = hintCanvasRef.current;
      if (!active || !detailEl || !hintEl) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      positionCanvas(map, detailEl, dpr);
      positionCanvas(map, hintEl, dpr);

      const detailCtx = detailEl.getContext("2d");
      const hintCtx = hintEl.getContext("2d");
      if (!detailCtx || !hintCtx) return;

      const size = map.getSize();
      const topLeft = map.containerPointToLayerPoint(L.point(0, 0));
      const bounds = map.getBounds().pad(0.22);
      const scaleAtZoom = zoomScale(map.getZoom());
      const placements = getFantasyAtlasPlacements({
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast(),
      });
      const visibility = visibilityRef.current;
      const revealedKeys = new Set(visibility.revealedCellKeys);

      for (const ctx of [detailCtx, hintCtx]) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size.x, size.y);
        ctx.imageSmoothingEnabled = true;
      }

      for (const placement of placements) {
        const image = images.get(placement.motif);
        if (!image || !image.complete || image.naturalWidth === 0) continue;

        const point = map
          .latLngToLayerPoint(L.latLng(placement.lat, placement.lng))
          .subtract(topLeft);
        const baseSize = MOTIF_SIZE_PX[placement.motif];
        const width = baseSize.width * placement.scale * scaleAtZoom;
        const height = baseSize.height * placement.scale * scaleAtZoom;

        if (
          point.x + width < -24 ||
          point.x - width > size.x + 24 ||
          point.y + height < -24 ||
          point.y - height > size.y + 24
        ) {
          continue;
        }

        detailCtx.save();
        detailCtx.translate(point.x, point.y);
        detailCtx.rotate((placement.rotationDegrees * Math.PI) / 180);
        detailCtx.globalAlpha =
          placement.opacity * (streetReference ? 0.16 : 1);
        detailCtx.drawImage(image, -width / 2, -height / 2, width, height);
        detailCtx.restore();

        if (
          streetReference ||
          !isSparseBiomeHint(placement) ||
          isPlacementRevealed(placement, visibility, revealedKeys)
        ) {
          continue;
        }

        hintCtx.save();
        hintCtx.translate(point.x, point.y);
        hintCtx.rotate((placement.rotationDegrees * Math.PI) / 180);
        hintCtx.globalAlpha = placement.opacity * UNCHARTED_HINT_OPACITY;
        hintCtx.drawImage(image, -width / 2, -height / 2, width, height);
        hintCtx.restore();
      }
    };

    const scheduler = createOverlayRedrawScheduler(drawNow);
    positionSchedulerRef.current = scheduler;
    const redraw = () => scheduler.paintNow();
    redrawRef.current = redraw;

    for (const [motif, src] of Object.entries(MOTIF_ASSETS) as Array<
      [FantasyMapMotif, string]
    >) {
      const image = new Image();
      image.onload = redraw;
      image.src = src;
      images.set(motif, image);
    }

    redraw();
    map.on("moveend", redraw);
    map.on("zoomend", redraw);
    map.on("viewreset", redraw);
    map.on("resize", redraw);

    return () => {
      active = false;
      scheduler.cancel();
      map.off("moveend", redraw);
      map.off("zoomend", redraw);
      map.off("viewreset", redraw);
      map.off("resize", redraw);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (redrawRef.current === redraw) redrawRef.current = null;
      detailPane?.replaceChildren();
      hintPane?.replaceChildren();
      detailCanvasRef.current = null;
      hintCanvasRef.current = null;
      if (scannerOverlay) scannerOverlay.style.display = previousScannerDisplay;
    };
  }, [enabled, map, streetReference]);

  useLayoutEffect(() => {
    if (enabled) redrawRef.current?.();
  }, [enabled, revealedCellKeys]);

  useLayoutEffect(() => {
    if (!enabled) return;
    positionSchedulerRef.current?.paintDebounced();
  }, [enabled, playerLat, playerLng]);

  return null;
}
