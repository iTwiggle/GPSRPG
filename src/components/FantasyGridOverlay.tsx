"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import {
  FANTASY_GRID_TILE_METERS,
  getBiomePalette,
  snapToTileCell,
  tileVariationHash,
  type FantasySurfaceBiome,
} from "@/lib/fantasy-grid-surface";

const PANE_NAME = "fantasyGridPane";
/** Below overlay (400) and marker (600) panes so sites stay visible. */
const PANE_Z_INDEX = "250";
const SCREEN_TILE_PX = 36;
/** Below this on-screen size, world-meter tiles are skipped in favor of screen tiles. */
const MIN_WORLD_TILE_PX = 8;

interface FantasyGridOverlayProps {
  biome: FantasySurfaceBiome;
  enabled: boolean;
  streetReference: boolean;
}

function adjustColor(hex: string, delta: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 0xff) + delta));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + delta));
  const b = Math.min(255, Math.max(0, (n & 0xff) + delta));
  return `rgb(${r}, ${g}, ${b})`;
}

function lngStepAtLat(lat: number): number {
  return FANTASY_GRID_TILE_METERS / (111_320 * Math.cos((lat * Math.PI) / 180));
}

function layerToCanvasPoint(
  map: L.Map,
  latlng: L.LatLngExpression,
  topLeft: L.Point
): L.Point {
  return map.latLngToLayerPoint(latlng).subtract(topLeft);
}

function estimateWorldTilePx(map: L.Map, topLeft: L.Point): number {
  const center = map.getCenter();
  const { latStep } = snapToTileCell(center.lat, center.lng);
  const rowLngStep = lngStepAtLat(center.lat);
  const origin = layerToCanvasPoint(map, center, topLeft);
  const north = layerToCanvasPoint(map, L.latLng(center.lat + latStep, center.lng), topLeft);
  const east = layerToCanvasPoint(map, L.latLng(center.lat, center.lng + rowLngStep), topLeft);
  return Math.min(Math.abs(north.y - origin.y), Math.abs(east.x - origin.x));
}

function pickTileFill(
  palette: ReturnType<typeof getBiomePalette>,
  variation: number
): string {
  if (variation > 0.66) return palette.highlight;
  if (variation > 0.33) return palette.accent;
  return adjustColor(palette.base, Math.round((variation - 0.5) * 12));
}

function drawTileShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  palette: ReturnType<typeof getBiomePalette>,
  biome: FantasySurfaceBiome,
  variation: number
) {
  if (w < 1 || h < 1) return;

  const skew = Math.min(4, w * 0.08);
  const fill = pickTileFill(palette, variation);

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y - skew);
  ctx.lineTo(x + w, y + h - skew);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  if (biome === "water" && variation > 0.55) {
    ctx.strokeStyle = palette.rune;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.45, Math.min(w, h) * 0.12, 0, Math.PI * 2);
    ctx.stroke();
  } else if (biome === "settlement" && variation > 0.7) {
    ctx.fillStyle = palette.rune;
    ctx.fillRect(x + w * 0.35, y + h * 0.35, w * 0.3, h * 0.08);
  } else if (biome === "shrine" && variation > 0.6) {
    ctx.strokeStyle = palette.rune;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + h * 0.25);
    ctx.lineTo(x + w * 0.65, y + h * 0.55);
    ctx.lineTo(x + w * 0.35, y + h * 0.55);
    ctx.closePath();
    ctx.stroke();
  } else if (variation > 0.82) {
    ctx.fillStyle = palette.rune;
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.28, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const inner = Math.min(w, h) * 0.15;
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.fillRect(x + inner * 0.5, y + inner * 0.5, inner, inner * 0.4);
}

function drawScannerLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.strokeStyle = "rgba(167, 139, 250, 0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += 48) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
    ctx.stroke();
  }
  for (let j = 0; j < height; j += 48) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(width, j);
    ctx.stroke();
  }
}

function drawScreenSpaceGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: ReturnType<typeof getBiomePalette>,
  biome: FantasySurfaceBiome
) {
  const cols = Math.ceil(width / SCREEN_TILE_PX) + 1;
  const rows = Math.ceil(height / SCREEN_TILE_PX) + 1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * SCREEN_TILE_PX;
      const y = row * SCREEN_TILE_PX;
      const variation = tileVariationHash(col * 0.31, row * 0.47);
      drawTileShape(ctx, x, y, SCREEN_TILE_PX, SCREEN_TILE_PX, palette, biome, variation);
    }
  }
}

function drawWorldSpaceGrid(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  topLeft: L.Point,
  width: number,
  height: number,
  palette: ReturnType<typeof getBiomePalette>,
  biome: FantasySurfaceBiome
): number {
  const bounds = map.getBounds();
  const pad = 0.003;
  const south = bounds.getSouth() - pad;
  const north = bounds.getNorth() + pad;
  const west = bounds.getWest() - pad;
  const east = bounds.getEast() + pad;
  const latStep = FANTASY_GRID_TILE_METERS / 111_320;
  const startLat = Math.floor(south / latStep) * latStep;
  let drawn = 0;

  for (let lat = startLat; lat <= north; lat += latStep) {
    const rowLngStep = lngStepAtLat(lat);
    const startLng = Math.floor(west / rowLngStep) * rowLngStep;

    for (let lng = startLng; lng <= east; lng += rowLngStep) {
      const nw = layerToCanvasPoint(map, L.latLng(lat + latStep, lng), topLeft);
      const se = layerToCanvasPoint(map, L.latLng(lat, lng + rowLngStep), topLeft);

      if (se.x < -24 || nw.x > width + 24 || se.y < -24 || nw.y > height + 24) {
        continue;
      }

      const x = nw.x;
      const y = nw.y;
      const w = se.x - nw.x;
      const h = se.y - nw.y;

      if (w < MIN_WORLD_TILE_PX || h < MIN_WORLD_TILE_PX) continue;

      const variation = tileVariationHash(lat, lng);
      drawTileShape(ctx, x, y, w, h, palette, biome, variation);
      drawn++;
    }
  }

  return drawn;
}

function drawFantasyGrid(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  biome: FantasySurfaceBiome,
  dpr: number
) {
  const palette = getBiomePalette(biome);
  const size = map.getSize();
  const topLeft = map.containerPointToLayerPoint(L.point(0, 0));

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size.x, size.y);

  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, size.x, size.y);

  const worldTilePx = estimateWorldTilePx(map, topLeft);
  const useScreenSpace = worldTilePx < MIN_WORLD_TILE_PX;

  if (useScreenSpace) {
    drawScreenSpaceGrid(ctx, size.x, size.y, palette, biome);
  } else {
    const drawn = drawWorldSpaceGrid(
      ctx,
      map,
      topLeft,
      size.x,
      size.y,
      palette,
      biome
    );
    if (drawn === 0) {
      drawScreenSpaceGrid(ctx, size.x, size.y, palette, biome);
    }
  }

  drawScannerLines(ctx, size.x, size.y);
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

export default function FantasyGridOverlay({
  biome,
  enabled,
  streetReference,
}: FantasyGridOverlayProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streetReferenceRef = useRef(streetReference);

  streetReferenceRef.current = streetReference;

  useEffect(() => {
    if (!enabled) {
      const existing = map.getPane(PANE_NAME);
      if (existing) {
        existing.replaceChildren();
      }
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
    canvas.className = "fantasy-grid-canvas";
    canvas.setAttribute("aria-hidden", "true");
    pane.replaceChildren(canvas);
    canvasRef.current = canvas;
    canvas.style.opacity = streetReferenceRef.current ? "0.38" : "0.78";

    const redraw = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        const el = canvasRef.current;
        if (!el) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        positionCanvas(map, el, dpr);

        const ctx = el.getContext("2d");
        if (!ctx) return;
        drawFantasyGrid(ctx, map, biome, dpr);
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
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      pane?.replaceChildren();
      canvasRef.current = null;
    };
  }, [map, enabled, biome]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    canvas.style.opacity = streetReference ? "0.38" : "0.78";
  }, [streetReference, enabled]);

  return null;
}
