"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import {
  EXPLORATION_CELL_METERS,
  EXPLORATION_REVEAL_RADIUS_METERS,
  getExplorationCellCenter,
  parseExplorationCellKey,
} from "@/lib/exploration-memory";

const PANE_NAME = "explorationFogPane";
const PANE_Z_INDEX = "360";
const KNOWN_TERRITORY_CLEAR_ALPHA = 0.72;

interface ExplorationFogOverlayProps {
  enabled: boolean;
  playerLat: number;
  playerLng: number;
  revealedCellKeys: string[];
}

function layerToCanvasPoint(
  map: L.Map,
  latlng: L.LatLngExpression,
  topLeft: L.Point
): L.Point {
  return map.latLngToLayerPoint(latlng).subtract(topLeft);
}

function positionCanvas(map: L.Map, canvas: HTMLCanvasElement, dpr: number) {
  const size = map.getSize();
  const topLeft = map.containerPointToLayerPoint(L.point(0, 0));

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
  const size = map.getSize();
  const topLeft = map.containerPointToLayerPoint(L.point(0, 0));
  const bounds = map.getBounds().pad(0.35);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size.x, size.y);
  ctx.fillStyle = "rgba(1, 3, 7, 0.9)";
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

  useEffect(() => {
    if (!enabled) {
      const existing = map.getPane(PANE_NAME);
      if (existing) existing.replaceChildren();
      canvasRef.current = null;
      return;
    }

    let pane = map.getPane(PANE_NAME);
    if (!pane) {
      pane = map.createPane(PANE_NAME);
      pane.style.zIndex = PANE_Z_INDEX;
      pane.style.pointerEvents = "none";
    }

    const canvas = document.createElement("canvas");
    canvas.className = "exploration-fog-canvas";
    canvas.setAttribute("aria-hidden", "true");
    pane.replaceChildren(canvas);
    canvasRef.current = canvas;

    const redraw = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const el = canvasRef.current;
        if (!el) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        positionCanvas(map, el, dpr);
        const ctx = el.getContext("2d");
        if (!ctx) return;

        drawExplorationFog(
          ctx,
          map,
          dpr,
          playerLat,
          playerLng,
          revealedCellKeys
        );
      });
    };

    redraw();
    map.on("move", redraw);
    map.on("moveend", redraw);
    map.on("zoom", redraw);
    map.on("zoomend", redraw);
    map.on("zoomanim", redraw);
    map.on("viewreset", redraw);
    map.on("resize", redraw);

    return () => {
      map.off("move", redraw);
      map.off("moveend", redraw);
      map.off("zoom", redraw);
      map.off("zoomend", redraw);
      map.off("zoomanim", redraw);
      map.off("viewreset", redraw);
      map.off("resize", redraw);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      pane?.replaceChildren();
      canvasRef.current = null;
    };
  }, [map, enabled, playerLat, playerLng, revealedCellKeys]);

  return null;
}
