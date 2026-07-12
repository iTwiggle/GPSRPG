"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import {
  FANTASY_GRID_TILE_METERS,
  getBiomePalette,
  tileVariationHash,
  type FantasySurfaceBiome,
} from "@/lib/fantasy-grid-surface";

const PANE_NAME = "fantasyGridPane";
const PANE_Z_INDEX = "425";
const TERRAIN_REGION_METERS = FANTASY_GRID_TILE_METERS * 3;
const SCREEN_REGION_PX = 138;
const MIN_WORLD_REGION_PX = 18;
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

function layerToCanvasPoint(
  map: L.Map,
  latlng: L.LatLngExpression,
  topLeft: L.Point
): L.Point {
  return map.latLngToLayerPoint(latlng).subtract(topLeft);
}

function lngStepAtLat(lat: number, meters: number): number {
  return meters / (111_320 * Math.cos((lat * Math.PI) / 180));
}

function estimateWorldRegionPx(map: L.Map, topLeft: L.Point): number {
  const center = map.getCenter();
  const latStep = TERRAIN_REGION_METERS / 111_320;
  const lngStep = lngStepAtLat(center.lat, TERRAIN_REGION_METERS);
  const origin = layerToCanvasPoint(map, center, topLeft);
  const north = layerToCanvasPoint(
    map,
    L.latLng(center.lat + latStep, center.lng),
    topLeft
  );
  const east = layerToCanvasPoint(
    map,
    L.latLng(center.lat, center.lng + lngStep),
    topLeft
  );
  return Math.min(Math.abs(north.y - origin.y), Math.abs(east.x - origin.x));
}

function pickTerrainWash(palette: BiomePalette, variation: number): string {
  if (variation > 0.78) return palette.highlight;
  if (variation > 0.34) return palette.accent;
  return adjustColor(palette.base, Math.round((variation - 0.5) * 12));
}

function smoothClosedPath(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>
) {
  if (points.length < 3) return;
  const first = points[0];
  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const next = points[(i + 1) % points.length];
    ctx.quadraticCurveTo(
      point.x,
      point.y,
      (point.x + next.x) / 2,
      (point.y + next.y) / 2
    );
  }
  ctx.closePath();
}

function drawTerrainMass(
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

  const cx = x + w * (0.46 + (variation - 0.5) * 0.18);
  const cy = y + h * (0.5 + (0.5 - variation) * 0.14);
  const rx = w * (0.72 + variation * 0.28);
  const ry = h * (0.5 + (1 - variation) * 0.34);
  const pointCount = 10;
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2;
    const jitter = tileVariationHash(variation + i * 0.137, variation - i * 0.193);
    const radial = 0.76 + jitter * 0.38;
    points.push({
      x: cx + Math.cos(angle) * rx * radial,
      y: cy + Math.sin(angle) * ry * radial,
    });
  }

  ctx.save();
  smoothClosedPath(ctx, points);
  ctx.globalAlpha = 0.26 + variation * 0.16;
  ctx.fillStyle = pickTerrainWash(palette, variation);
  ctx.fill();

  ctx.translate(cx, cy);
  ctx.rotate((variation - 0.5) * 0.42);
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = palette.highlight;
  ctx.beginPath();
  ctx.ellipse(-rx * 0.12, -ry * 0.08, rx * 0.56, ry * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (variation > 0.48) {
    drawBiomeInk(ctx, cx, cy, Math.min(w, h), palette, biome, variation);
  }
}

function drawBiomeInk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  palette: BiomePalette,
  biome: FantasySurfaceBiome,
  variation: number
) {
  const scale = size * (0.2 + variation * 0.08);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = palette.rune;
  ctx.fillStyle = palette.rune;
  ctx.lineWidth = Math.max(0.8, size * 0.012);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (biome === "water") {
    for (let row = -1; row <= 1; row++) {
      const y = cy + row * scale * 0.46;
      ctx.beginPath();
      ctx.moveTo(cx - scale, y);
      ctx.bezierCurveTo(
        cx - scale * 0.55,
        y - scale * 0.28,
        cx - scale * 0.1,
        y + scale * 0.28,
        cx + scale * 0.34,
        y
      );
      ctx.bezierCurveTo(
        cx + scale * 0.6,
        y - scale * 0.18,
        cx + scale * 0.82,
        y - scale * 0.08,
        cx + scale,
        y
      );
      ctx.stroke();
    }
  } else if (biome === "grove") {
    for (let tree = -1; tree <= 1; tree++) {
      const tx = cx + tree * scale * 0.68;
      const ty = cy + Math.abs(tree) * scale * 0.14;
      ctx.beginPath();
      ctx.moveTo(tx, ty - scale * 0.72);
      ctx.lineTo(tx + scale * 0.38, ty - scale * 0.08);
      ctx.lineTo(tx + scale * 0.16, ty - scale * 0.08);
      ctx.lineTo(tx + scale * 0.46, ty + scale * 0.42);
      ctx.lineTo(tx - scale * 0.46, ty + scale * 0.42);
      ctx.lineTo(tx - scale * 0.16, ty - scale * 0.08);
      ctx.lineTo(tx - scale * 0.38, ty - scale * 0.08);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tx, ty + scale * 0.42);
      ctx.lineTo(tx, ty + scale * 0.72);
      ctx.stroke();
    }
  } else if (biome === "settlement") {
    ctx.beginPath();
    ctx.moveTo(cx - scale * 1.05, cy + scale * 0.46);
    ctx.bezierCurveTo(
      cx - scale * 0.45,
      cy - scale * 0.38,
      cx + scale * 0.26,
      cy + scale * 0.18,
      cx + scale * 1.08,
      cy - scale * 0.5
    );
    ctx.stroke();
    for (let i = -2; i <= 2; i++) {
      const px = cx + i * scale * 0.34;
      const py = cy + Math.sin(i * 1.7 + variation * 3) * scale * 0.23;
      ctx.strokeRect(px - scale * 0.12, py - scale * 0.08, scale * 0.24, scale * 0.16);
    }
  } else if (biome === "stone") {
    ctx.beginPath();
    ctx.moveTo(cx - scale * 0.9, cy + scale * 0.65);
    ctx.lineTo(cx - scale * 0.72, cy - scale * 0.48);
    ctx.lineTo(cx - scale * 0.22, cy - scale * 0.18);
    ctx.lineTo(cx + scale * 0.04, cy - scale * 0.72);
    ctx.lineTo(cx + scale * 0.28, cy - scale * 0.12);
    ctx.lineTo(cx + scale * 0.82, cy - scale * 0.38);
    ctx.lineTo(cx + scale * 0.9, cy + scale * 0.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - scale * 0.22, cy - scale * 0.18);
    ctx.lineTo(cx + scale * 0.18, cy + scale * 0.16);
    ctx.lineTo(cx - scale * 0.04, cy + scale * 0.58);
    ctx.stroke();
  } else if (biome === "shrine") {
    ctx.beginPath();
    ctx.moveTo(cx, cy - scale * 0.9);
    ctx.lineTo(cx + scale * 0.78, cy + scale * 0.62);
    ctx.lineTo(cx - scale * 0.78, cy + scale * 0.62);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + scale * 0.08, scale * 0.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - scale * 0.5);
    ctx.lineTo(cx, cy + scale * 0.48);
    ctx.stroke();
  } else {
    for (let tuft = -2; tuft <= 2; tuft++) {
      const tx = cx + tuft * scale * 0.34;
      const baseY = cy + Math.sin(tuft * 2.1 + variation * 5) * scale * 0.18;
      ctx.beginPath();
      ctx.moveTo(tx, baseY + scale * 0.42);
      ctx.quadraticCurveTo(tx - scale * 0.12, baseY, tx - scale * 0.28, baseY - scale * 0.34);
      ctx.moveTo(tx, baseY + scale * 0.42);
      ctx.quadraticCurveTo(tx + scale * 0.06, baseY - scale * 0.08, tx + scale * 0.2, baseY - scale * 0.5);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawContourInk(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: BiomePalette,
  center: L.LatLng
) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 0.8;

  const bands = Math.max(6, Math.ceil(height / 74));
  for (let band = 0; band < bands; band++) {
    const seed = tileVariationHash(center.lat + band * 0.173, center.lng - band * 0.119);
    const baseY = ((band + 0.5) / bands) * height;
    ctx.beginPath();
    for (let x = -24; x <= width + 24; x += 24) {
      const y =
        baseY +
        Math.sin(x * 0.015 + seed * Math.PI * 2) * (8 + seed * 10) +
        Math.sin(x * 0.005 + band * 0.9) * 13;
      if (x === -24) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
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
  const cols = Math.ceil(width / SCREEN_REGION_PX) + 3;
  const rows = Math.ceil(height / SCREEN_REGION_PX) + 3;

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const x = col * SCREEN_REGION_PX;
      const y = row * SCREEN_REGION_PX;
      const variation = tileVariationHash(
        center.lat + col * 0.041,
        center.lng + row * 0.057
      );
      drawTerrainMass(
        ctx,
        x,
        y,
        SCREEN_REGION_PX,
        SCREEN_REGION_PX,
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
  const pad = 0.004;
  const south = bounds.getSouth() - pad;
  const north = bounds.getNorth() + pad;
  const west = bounds.getWest() - pad;
  const east = bounds.getEast() + pad;
  const latStep = TERRAIN_REGION_METERS / 111_320;
  const startLat = Math.floor(south / latStep) * latStep;
  let drawn = 0;

  for (let lat = startLat; lat <= north; lat += latStep) {
    const lngStep = lngStepAtLat(lat, TERRAIN_REGION_METERS);
    const startLng = Math.floor(west / lngStep) * lngStep;

    for (let lng = startLng; lng <= east; lng += lngStep) {
      const nw = layerToCanvasPoint(map, L.latLng(lat + latStep, lng), topLeft);
      const se = layerToCanvasPoint(map, L.latLng(lat, lng + lngStep), topLeft);

      if (
        se.x < -SCREEN_REGION_PX ||
        nw.x > width + SCREEN_REGION_PX ||
        se.y < -SCREEN_REGION_PX ||
        nw.y > height + SCREEN_REGION_PX
      ) {
        continue;
      }

      const w = se.x - nw.x;
      const h = se.y - nw.y;
      if (w < MIN_WORLD_REGION_PX || h < MIN_WORLD_REGION_PX) continue;

      const variation = tileVariationHash(lat, lng);
      drawTerrainMass(ctx, nw.x, nw.y, w, h, palette, biome, variation);
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
  const player = layerToCanvasPoint(map, L.latLng(playerLat, playerLng), topLeft);
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
  const player = layerToCanvasPoint(map, L.latLng(playerLat, playerLng), topLeft);
  const radius = revealRadiusPx(map, topLeft, playerLat, playerLng);
  const veil = ctx.createRadialGradient(
    player.x,
    player.y,
    radius * 0.28,
    player.x,
    player.y,
    radius
  );
  veil.addColorStop(0, "rgba(5, 6, 7, 0)");
  veil.addColorStop(0.48, "rgba(5, 6, 7, 0.02)");
  veil.addColorStop(0.7, "rgba(4, 5, 7, 0.3)");
  veil.addColorStop(0.88, "rgba(2, 4, 6, 0.7)");
  veil.addColorStop(1, "rgba(1, 2, 4, 0.93)");

  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, width, height);

  const center = map.getCenter();
  for (let i = 0; i < 14; i++) {
    const variation = tileVariationHash(center.lat + i * 0.071, center.lng - i * 0.053);
    const angle = variation * Math.PI * 2 + i * 0.91;
    const distance = radius * (0.76 + (i % 4) * 0.13);
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance * 0.8;
    const cloudRadius = radius * (0.11 + variation * 0.14);
    const cloud = ctx.createRadialGradient(x, y, 0, x, y, cloudRadius);
    cloud.addColorStop(0, "rgba(20, 22, 20, 0.14)");
    cloud.addColorStop(0.45, "rgba(8, 10, 12, 0.17)");
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
  const center = map.getCenter();

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size.x, size.y);

  const wash = ctx.createLinearGradient(0, 0, size.x, size.y);
  wash.addColorStop(0, "#12110d");
  wash.addColorStop(0.52, adjustColor(palette.base, -9));
  wash.addColorStop(1, "#17150f");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, size.x, size.y);

  const worldRegionPx = estimateWorldRegionPx(map, topLeft);
  const useScreenSpace = worldRegionPx < MIN_WORLD_REGION_PX;

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

  drawContourInk(ctx, size.x, size.y, palette, center);
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
