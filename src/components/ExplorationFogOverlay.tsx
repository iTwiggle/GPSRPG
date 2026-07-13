"use client";

import L from "leaflet";
import { useLayoutEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import {
  EXPLORATION_CELL_METERS,
  EXPLORATION_REVEAL_RADIUS_METERS,
  getExplorationCellCenter,
  parseExplorationCellKey,
} from "@/lib/exploration-memory";

const PANE_NAME = "explorationFogPane";
// Conceal base tiles below authored biome motifs and the already-filtered
// discovered POIs, Wayfarer, explore radius, tooltips, and popups.
const PANE_Z_INDEX = "550";
const KNOWN_TERRITORY_CLEAR_ALPHA = 0.72;
// Leave painted fog beyond every viewport edge so Leaflet's animated pane
// transform cannot expose base tiles between move events and our next redraw.
const FOG_CANVAS_OVERSCAN_PX = 96;

interface ExplorationFogOverlayProps {
  enabled: boolean;
  playerLat: number;
  playerLng: number;
  revealedCellKeys: string[];
}

interface FogRenderState {
  playerLat: number;
  playerLng: number;
  revealedCellKeys: string[];
}

interface FogCanvasViewport {
  size: L.Point;
  topLeft: L.Point;
}

function getFogCanvasViewport(map: L.Map): FogCanvasViewport {
  const mapSize = map.getSize();
  const padding = FOG_CANVAS_OVERSCAN_PX;

  return {
    size: L.point(mapSize.x + padding * 2, mapSize.y + padding * 2),
    topLeft: map.containerPointToLayerPoint(L.point(-padding, -padding)),
  };
}

function layerToCanvasPoint(
  map: L.Map,
  latlng: L.LatLngExpression,
  topLeft: L.Point
): L.Point {
  return map.latLngToLayerPoint(latlng).subtract(topLeft);
}

function positionCanvas(map: L.Map, canvas: HTMLCanvasElement, dpr: number) {
  const { size, topLeft } = getFogCanvasViewport(map);

  canvas.width = Math.max(1, Math.floor(size.x * dpr));
  canvas.height = Math.max(1, Math.floor(size.y * dpr));
  canvas.style.width = `${size.x}px`;
  canvas.style.height = `${size.y}px`;
  L.DomUtil.setPosition(canvas, topLeft);
}

function metersToPixels(
  map: L.Map,
  topLeft: L.Point,
  lat: number,
  lng: number,
  meters: number
): number {
  const origin = layerToCanvasPoint(map, L.latLng(lat, lng), topLeft);
  const north = layerToCanvasPoint(
    map,
    L.latLng(lat + meters / 111_320, lng),
    topLeft
  );
  return Math.max(12, Math.abs(north.y - origin.y));
}

function clearSoftCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number
) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
  gradient.addColorStop(0.62, `rgba(255, 255, 255, ${alpha})`);
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawExplorationFog(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  dpr: number,
  playerLat: number,
  playerLng: number,
  revealedCellKeys: string[]
) {
  const { size, topLeft } = getFogCanvasViewport(map);
  const bounds = map.getBounds().pad(0.35);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size.x, size.y);
  ctx.fillStyle = "rgb(1, 3, 7)";
  ctx.fillRect(0, 0, size.x, size.y);

  ctx.save();
  ctx.globalCompositeOperation = "destination-out";

  for (const key of revealedCellKeys) {
    const cell = parseExplorationCellKey(key);
    if (!cell) continue;
    const center = getExplorationCellCenter(cell);
    if (!bounds.contains(L.latLng(center.lat, center.lng))) continue;

    const point = layerToCanvasPoint(
      map,
      L.latLng(center.lat, center.lng),
      topLeft
    );
    const radius = metersToPixels(
      map,
      topLeft,
      center.lat,
      center.lng,
      EXPLORATION_CELL_METERS * 0.9
    );
    clearSoftCircle(
      ctx,
      point.x,
      point.y,
      radius,
      KNOWN_TERRITORY_CLEAR_ALPHA
    );
  }

  const player = layerToCanvasPoint(
    map,
    L.latLng(playerLat, playerLng),
    topLeft
  );
  const currentRadius = metersToPixels(
    map,
    topLeft,
    playerLat,
    playerLng,
    EXPLORATION_REVEAL_RADIUS_METERS * 1.15
  );
  clearSoftCircle(ctx, player.x, player.y, currentRadius, 1);

  ctx.restore();
}

export default function ExplorationFogOverlay({
  enabled,
  playerLat,
  playerLng,
  revealedCellKeys,
}: ExplorationFogOverlayProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const redrawRef = useRef<(() => void) | null>(null);
  const renderStateRef = useRef<FogRenderState>({
    playerLat,
    playerLng,
    revealedCellKeys,
  });

  renderStateRef.current = { playerLat, playerLng, revealedCellKeys };

  useLayoutEffect(() => {
    if (!enabled) {
      const existing = map.getPane(PANE_NAME);
      if (existing) existing.replaceChildren();
      canvasRef.current = null;
      redrawRef.current = null;
      return;
    }

    let pane = map.getPane(PANE_NAME);
    if (!pane) {
      pane = map.createPane(PANE_NAME);
    }
    pane.style.zIndex = PANE_Z_INDEX;
    pane.style.pointerEvents = "none";

    const canvas = document.createElement("canvas");
    canvas.className = "exploration-fog-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvasRef.current = canvas;

    let active = true;

    const drawNow = () => {
      const el = canvasRef.current;
      if (!active || !el) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      positionCanvas(map, el, dpr);
      const ctx = el.getContext("2d");
      if (!ctx) return;

      const state = renderStateRef.current;
      drawExplorationFog(
        ctx,
        map,
        dpr,
        state.playerLat,
        state.playerLng,
        state.revealedCellKeys
      );
    };

    const redraw = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        drawNow();
      });
    };

    redrawRef.current = redraw;

    // Paint before attaching the canvas so enabling fog never exposes a blank
    // map frame. Subsequent GPS/memory updates repaint this same canvas.
    drawNow();
    pane.replaceChildren(canvas);

    map.on("move", redraw);
    map.on("moveend", redraw);
    map.on("zoomend", redraw);
    map.on("viewreset", redraw);
    map.on("resize", redraw);

    return () => {
      active = false;
      map.off("move", redraw);
      map.off("moveend", redraw);
      map.off("zoomend", redraw);
      map.off("viewreset", redraw);
      map.off("resize", redraw);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (redrawRef.current === redraw) redrawRef.current = null;
      if (canvasRef.current === canvas) {
        pane?.replaceChildren();
        canvasRef.current = null;
      }
    };
  }, [map, enabled]);

  useLayoutEffect(() => {
    if (enabled) redrawRef.current?.();
  }, [enabled, playerLat, playerLng, revealedCellKeys]);

  return null;
}
