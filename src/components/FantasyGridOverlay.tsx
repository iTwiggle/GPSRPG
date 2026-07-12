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
const PANE_Z_INDEX = "425";
const SCREEN_PATCH_PX = 46;
const MIN_WORLD_TILE_PX = 8;
const FIELD_VEIL_METERS = 260;

type BiomePalette = ReturnType<typeof getBiomePalette>;

interface FantasyGridOverlayProps {
  biome: FantasySurfaceBiome;
  enabled: boolean;
  streetReference: boolean;
  playerLat: number;
  playerLng: number;
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
  const north = layerToCanvasPoint(
    map,
    L.latLng(center.lat + latStep, center.lng),
    topLeft
  );
  const east = layerToCanvasPoint(
    map,
    L.latLng(center.lat, center.lng + rowLngStep),
    topLeft
  );
  return Math.min(Math.abs(north.y - origin.y), Math.abs(east.x - origin.x));
}

function pickTerrainFill(palette: BiomePalette, variation: number): string {
  if (variation > 0.76) return palette.highlight;
  if (variation > 0.34) return palette.accent;
  return adjustColor(palette.base, Math.round((variation - 0.5) * 16));
}

function drawTerrainMotif(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  palette: BiomePalette,
  biome: FantasySurfaceBiome,
  variation: number
) {
  const cx = x + w * (0.38 + variation * 0.24);
  const cy = y + h * (0.36 + (1 - variation) * 0.24);
  const size = Math.min(w, h);

  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.strokeStyle = palette.rune;
  ctx.fillStyle = palette.rune;
  ctx.lineWidth = Math.max(0.65, size * 0.025);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (biome === "water") {
    for (let wave = 0; wave < 2; wave++) {
      const wy = cy + wave * size * 0.15;
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.28, wy);
      ctx.bezierCurveTo(
        cx - size * 0.12,
        wy - size * 0.1,
        cx + size * 0.08,
        wy + size * 0.1,
        cx + size * 0.28,
        wy
      );
      ctx.stroke();
    }
  } else if (biome === "grove") {
    ctx.beginPath();
    ctx.arc(cx - size * 0.08, cy, size * 0.16, 0, Math.PI * 2);
    ctx.arc(cx + size * 0.1, cy + size * 0.04, size * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.08);
    ctx.lineTo(cx, cy + size * 0.3);
    ctx.stroke();
  } else if (biome === "settlement") {
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.28, cy - size * 0.18);
    ctx.lineTo(cx + size * 0.24, cy - size * 0.04);
    ctx.moveTo(cx - size * 0.22, cy + size * 0.04);
    ctx.lineTo(cx + size * 0.28, cy + size * 0.18);
    ctx.moveTo(cx - size * 0.06, cy - size * 0.24);
    ctx.lineTo(cx - size * 0.13, cy + size * 0.22);
    ctx.moveTo(cx + size * 0.13, cy - size * 0.18);
    ctx.lineTo(cx + size * 0.05, cy + size * 0.26);
    ctx.stroke();
  } else if (biome === "stone") {
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.22, cy - size * 0.2);
    ctx.lineTo(cx - size * 0.03, cy - size * 0.03);
    ctx.lineTo(cx - size * 0.12, cy + size * 0.24);
    ctx.moveTo(cx - size * 0.03, cy - size * 0.03);
    ctx.lineTo(cx + size * 0.22, cy - size * 0.14);
    ctx.moveTo(cx - size * 0.03, cy - size * 0.03);
    ctx.lineTo(cx + size * 0.16, cy + size * 0.21);
    ctx.stroke();
  } else if (biome === "shrine") {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.27);
    ctx.lineTo(cx + size * 0.24, cy + size * 0.2);
    ctx.lineTo(cx - size * 0.24, cy + size * 0.2);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + size * 0.03, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
  } else {
    for (let blade = -1; blade <= 1; blade++) {
      const bx = cx + blade * size * 0.13;
      ctx.beginPath();
      ctx.moveTo(bx, cy + size * 0.22);
      ctx.quadraticCurveTo(
        bx + blade * size * 0.04,
        cy,
        bx + blade * size * 0.08,
        cy - size * 0.18
      );
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawTerrainPatch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  palette: BiomePalette,
  biome: FantasySurfaceBiome,
  variation: number
) {
  if (w < 1 || h < 1) return;

  const jitterX = (variation - 0.5) * w * 0.22;
  const jitterY = (0.5 - variation) * h * 0.18;
  const overlap = Math.min(w, h) * 0.12;

  ctx.beginPath();
  ctx.moveTo(x - overlap + jitterX * 0.2, y + h * 0.14);
  ctx.quadraticCurveTo(
    x + w * 0.3,
    y - overlap + jitterY,
    x + w * 0.78,
    y + h * 0.04
  );
  ctx.quadraticCurveTo(
    x + w + overlap + jitterX,
    y + h * 0.28,
    x + w * 0.94,
    y + h * 0.76
  );
  ctx.quadraticCurveTo(
    x + w * 0.72,
    y + h + overlap - jitterY,
    x + w * 0.22,
    y + h * 0.93
  );
  ctx.quadraticCurveTo(
    x - overlap - jitterX,
    y + h * 0.7,
    x - overlap + jitterX * 0.2,
    y + h * 0.14
  );
  ctx.closePath();

  const fill = pickTerrainFill(palette, variation);
  ctx.fillStyle = fill;
  ctx.globalAlpha = 0.78 + variation * 0.14;
  ctx.fill();

  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = Math.max(0.6, Math.min(w, h) * 0.018);
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (variation > 0.2) {
    drawTerrainMotif(ctx, x, y, w, h, palette, biome, variation);
  }
}

function drawScreenSpaceTerrain(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  width: number,
  height: number,
  palette: BiomePalette,
  biome: FantasySurfaceBiome
) {
  const center = map.getCenter();
  const cols = Math.ceil(width / SCREEN_PATCH_PX) + 2;
  const rows = Math.ceil(height / SCREEN_PATCH_PX) + 2;

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const x = col * SCREEN_PATCH_PX;
      const y = row * SCREEN_PATCH_PX;
      const variation = tileVariationHash(
        center.lat + col * 0.017,
        center.lng + row * 0.023
      );
      drawTerrainPatch(
        ctx,
        x,
        y,
        SCREEN_PATCH_PX,
        SCREEN_PATCH_PX,
        palette,
        biome,
        variation
      );
    }
  }
}

function drawWorldSpaceTerrain(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  topLeft: L.Point,
  width: number,
  height: number,
  palette: BiomePalette,
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
      const nw = layerToCanvasPoint(
        map,
        L.latLng(lat + latStep, lng),
        topLeft
      );
      const se = layerToCanvasPoint(
        map,
        L.latLng(lat, lng + rowLngStep),
        topLeft
      );

      if (
        se.x < -36 ||
        nw.x > width + 36 ||
        se.y < -36 ||
        nw.y > height + 36
      ) {
        continue;
      }

      const w = se.x - nw.x;
      const h = se.y - nw.y;
      if (w < MIN_WORLD_TILE_PX || h < MIN_WORLD_TILE_PX) continue;

      const variation = tileVariationHash(lat, lng);
      drawTerrainPatch(ctx, nw.x, nw.y, w, h, palette, biome, variation);
      drawn++;
    }
  }

  return drawn;
}

function revealRadiusPx(
  map: L.Map,
  topLeft: L.Point,
  playerLat: number,
  playerLng: number
): number {
  const player = layerToCanvasPoint(
    map,
    L.latLng(playerLat, playerLng),
    topLeft
  );
  const north = layerToCanvasPoint(
    map,
    L.latLng(playerLat + FIELD_VEIL_METERS / 111_320, playerLng),
    topLeft
  );
  return Math.max(110, Math.abs(north.y - player.y));
}

function drawFieldVeil(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  topLeft: L.Point,
  width: number,
  height: number,
  palette: BiomePalette,
  playerLat: number,
  playerLng: number
) {
  const player = layerToCanvasPoint(
    map,
    L.latLng(playerLat, playerLng),
    topLeft
  );
  const radius = revealRadiusPx(map, topLeft, playerLat, playerLng);
  const veil = ctx.createRadialGradient(
    player.x,
    player.y,
    radius * 0.26,
    player.x,
    player.y,
    radius
  );
  veil.addColorStop(0, "rgba(3, 6, 10, 0)");
  veil.addColorStop(0.42, "rgba(3, 6, 10, 0.03)");
  veil.addColorStop(0.68, "rgba(3, 6, 10, 0.34)");
  veil.addColorStop(0.86, "rgba(2, 5, 9, 0.72)");
  veil.addColorStop(1, "rgba(1, 3, 7, 0.92)");

  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, width, height);

  const center = map.getCenter();
  for (let i = 0; i < 18; i++) {
    const variation = tileVariationHash(center.lat + i * 0.071, center.lng - i * 0.053);
    const angle = variation * Math.PI * 2 + i * 0.91;
    const distance = radius * (0.72 + (i % 5) * 0.12);
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance * 0.78;
    const cloudRadius = radius * (0.12 + variation * 0.15);
    const cloud = ctx.createRadialGradient(x, y, 0, x, y, cloudRadius);
    cloud.addColorStop(0, palette.border.replace(/0\.[0-9]+\)/, "0.08)"));
    cloud.addColorStop(0.45, "rgba(10, 14, 18, 0.18)");
    cloud.addColorStop(1, "rgba(3, 5, 8, 0)");
    ctx.fillStyle = cloud;
    ctx.fillRect(
      x - cloudRadius,
      y - cloudRadius,
      cloudRadius * 2,
      cloudRadius * 2
    );
  }
}

function drawFantasyCartography(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  biome: FantasySurfaceBiome,
  dpr: number,
  playerLat: number,
  playerLng: number
) {
  const palette = getBiomePalette(biome);
  const size = map.getSize();
  const topLeft = map.containerPointToLayerPoint(L.point(0, 0));

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size.x, size.y);

  const wash = ctx.createLinearGradient(0, 0, size.x, size.y);
  wash.addColorStop(0, adjustColor(palette.base, -8));
  wash.addColorStop(0.55, palette.base);
  wash.addColorStop(1, adjustColor(palette.base, 5));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, size.x, size.y);

  const worldTilePx = estimateWorldTilePx(map, topLeft);
  const useScreenSpace = worldTilePx < MIN_WORLD_TILE_PX;

  if (useScreenSpace) {
    drawScreenSpaceTerrain(ctx, map, size.x, size.y, palette, biome);
  } else {
    const drawn = drawWorldSpaceTerrain(
      ctx,
      map,
      topLeft,
      size.x,
      size.y,
      palette,
      biome
    );
    if (drawn === 0) {
      drawScreenSpaceTerrain(ctx, map, size.x, size.y, palette, biome);
    }
  }

  drawFieldVeil(
    ctx,
    map,
    topLeft,
    size.x,
    size.y,
    palette,
    playerLat,
    playerLng
  );
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
  playerLat,
  playerLng,
}: FantasyGridOverlayProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streetReferenceRef = useRef(streetReference);

  streetReferenceRef.current = streetReference;

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
    canvas.className = "fantasy-grid-canvas";
    canvas.setAttribute("aria-hidden", "true");
    pane.replaceChildren(canvas);
    canvasRef.current = canvas;
    canvas.style.opacity = streetReferenceRef.current ? "0.46" : "0.98";

    const redraw = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const el = canvasRef.current;
        if (!el) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        positionCanvas(map, el, dpr);

        const ctx = el.getContext("2d");
        if (!ctx) return;
        drawFantasyCartography(
          ctx,
          map,
          biome,
          dpr,
          playerLat,
          playerLng
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
  }, [map, enabled, biome, playerLat, playerLng]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    canvas.style.opacity = streetReference ? "0.46" : "0.98";
  }, [streetReference, enabled]);

  return null;
}
