"use client";

import L from "leaflet";
import { useLayoutEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import {
  getBiomePalette,
  tileVariationHash,
  type FantasyBiomePalette,
  type FantasySurfaceBiome,
} from "@/lib/fantasy-grid-surface";
import {
  getFantasyAtlasTerrainCells,
  type FantasyMapTerrainCell,
} from "@/lib/fantasy-map-art";

const PANE_NAME = "fantasyTerrainPane";
// Base tiles sit at 200, terrain at 325, atlas detail at 350, and fog at 550.
const PANE_Z_INDEX = "325";
const CANVAS_OVERSCAN_PX = 96;
const NORMAL_OPACITY = "0.96";
const STREET_REFERENCE_OPACITY = "0.18";
const DETAILED_REGION_MIN_PX = 58;

interface FantasyTerrainOverlayProps {
  enabled: boolean;
  streetReference: boolean;
}

interface TerrainCanvasViewport {
  size: L.Point;
  topLeft: L.Point;
}

interface RegionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getCanvasViewport(map: L.Map): TerrainCanvasViewport {
  const mapSize = map.getSize();
  const padding = CANVAS_OVERSCAN_PX;

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
  const { size, topLeft } = getCanvasViewport(map);

  canvas.width = Math.max(1, Math.floor(size.x * dpr));
  canvas.height = Math.max(1, Math.floor(size.y * dpr));
  canvas.style.width = `${size.x}px`;
  canvas.style.height = `${size.y}px`;
  L.DomUtil.setPosition(canvas, topLeft);
}

function projectRegion(
  map: L.Map,
  topLeft: L.Point,
  region: FantasyMapTerrainCell
): RegionRect {
  const northWest = layerToCanvasPoint(
    map,
    L.latLng(region.north, region.west),
    topLeft
  );
  const southEast = layerToCanvasPoint(
    map,
    L.latLng(region.south, region.east),
    topLeft
  );

  return {
    x: northWest.x,
    y: northWest.y,
    width: southEast.x - northWest.x,
    height: southEast.y - northWest.y,
  };
}

function adjustColor(hex: string, delta: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = Math.min(255, Math.max(0, ((value >> 16) & 0xff) + delta));
  const green = Math.min(255, Math.max(0, ((value >> 8) & 0xff) + delta));
  const blue = Math.min(255, Math.max(0, (value & 0xff) + delta));
  return `rgb(${red}, ${green}, ${blue})`;
}

function regionRandom(region: FantasyMapTerrainCell, salt: number): number {
  return tileVariationHash(
    region.row + salt * 0.173,
    region.column - salt * 0.119
  );
}

function traceOrganicRegion(
  ctx: CanvasRenderingContext2D,
  rect: RegionRect,
  region: FantasyMapTerrainCell,
  scale: number
) {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const radiusX = rect.width * 0.56 * scale;
  const radiusY = rect.height * 0.56 * scale;
  const points: Array<{ x: number; y: number }> = [];
  const pointCount = 12;

  for (let index = 0; index < pointCount; index++) {
    const angle = (index / pointCount) * Math.PI * 2;
    const radial = 0.82 + regionRandom(region, index + 1) * 0.3;
    points.push({
      x: centerX + Math.cos(angle) * radiusX * radial,
      y: centerY + Math.sin(angle) * radiusY * radial,
    });
  }

  const first = points[0];
  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);

  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    const next = points[(index + 1) % points.length];
    ctx.quadraticCurveTo(
      point.x,
      point.y,
      (point.x + next.x) / 2,
      (point.y + next.y) / 2
    );
  }

  ctx.closePath();
}

function drawWorldContourInk(
  ctx: CanvasRenderingContext2D,
  size: L.Point,
  topLeft: L.Point
) {
  const spacing = 72;
  const startBand = Math.floor(topLeft.y / spacing) - 2;
  const endBand = Math.ceil((topLeft.y + size.y) / spacing) + 2;
  ctx.save();
  ctx.strokeStyle = "rgba(184, 173, 132, 0.14)";
  ctx.lineWidth = 0.85;

  for (let band = startBand; band <= endBand; band++) {
    const seed = tileVariationHash(band, 0.731);
    const baseY = band * spacing - topLeft.y;
    ctx.beginPath();

    for (let x = -32; x <= size.x + 32; x += 24) {
      const worldX = x + topLeft.x;
      const y =
        baseY +
        Math.sin(worldX * 0.012 + seed * Math.PI * 2) * (8 + seed * 8) +
        Math.sin(worldX * 0.004 + band * 0.81) * 11;

      if (x === -32) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  ctx.restore();
}

function drawWaterMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.bezierCurveTo(
    x - size * 0.55,
    y - size * 0.28,
    x - size * 0.1,
    y + size * 0.28,
    x + size * 0.34,
    y
  );
  ctx.bezierCurveTo(
    x + size * 0.58,
    y - size * 0.16,
    x + size * 0.82,
    y - size * 0.08,
    x + size,
    y
  );
  ctx.stroke();
}

function drawGroundMark(
  ctx: CanvasRenderingContext2D,
  biome: FantasySurfaceBiome,
  x: number,
  y: number,
  size: number,
  variation: number
) {
  if (biome === "water") {
    drawWaterMark(ctx, x, y, size);
    return;
  }

  if (biome === "stone") {
    ctx.beginPath();
    ctx.moveTo(x - size * 0.55, y - size * 0.3);
    ctx.lineTo(x - size * 0.08, y + size * 0.08);
    ctx.lineTo(x - size * 0.28, y + size * 0.62);
    ctx.moveTo(x - size * 0.08, y + size * 0.08);
    ctx.lineTo(x + size * 0.62, y - size * 0.48);
    ctx.stroke();
    return;
  }

  if (biome === "settlement") {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, size * 0.18, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (biome === "shrine") {
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.68);
    ctx.lineTo(x + size * 0.58, y + size * 0.45);
    ctx.lineTo(x - size * 0.58, y + size * 0.45);
    ctx.closePath();
    ctx.stroke();
    return;
  }

  const lean = (variation - 0.5) * size * 0.34;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.58);
  ctx.quadraticCurveTo(x + lean, y, x - size * 0.28, y - size * 0.5);
  ctx.moveTo(x, y + size * 0.58);
  ctx.quadraticCurveTo(x - lean, y, x + size * 0.24, y - size * 0.62);
  ctx.stroke();
}

function drawGroundTexture(
  ctx: CanvasRenderingContext2D,
  rect: RegionRect,
  palette: FantasyBiomePalette,
  region: FantasyMapTerrainCell
) {
  const markCount = 5;
  const size = Math.min(rect.width, rect.height) * 0.06;
  ctx.save();
  ctx.strokeStyle = palette.rune;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = Math.max(0.7, size * 0.12);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let index = 0; index < markCount; index++) {
    const xVariation = regionRandom(region, index + 60);
    const yVariation = regionRandom(region, index + 90);
    drawGroundMark(
      ctx,
      region.biome,
      rect.x + xVariation * rect.width,
      rect.y + yVariation * rect.height,
      size * (0.72 + regionRandom(region, index + 120) * 0.55),
      xVariation
    );
  }

  ctx.restore();
}

function drawPaperGrain(
  ctx: CanvasRenderingContext2D,
  rect: RegionRect,
  region: FantasyMapTerrainCell
) {
  ctx.save();

  for (let index = 0; index < 12; index++) {
    const x = rect.x + regionRandom(region, index + 150) * rect.width;
    const y = rect.y + regionRandom(region, index + 210) * rect.height;
    const light = regionRandom(region, index + 270) > 0.48;
    ctx.fillStyle = light
      ? "rgba(224, 214, 177, 0.035)"
      : "rgba(3, 5, 4, 0.045)";
    ctx.beginPath();
    ctx.arc(
      x,
      y,
      0.55 + regionRandom(region, index + 330) * 1.35,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();
}

function drawTerrainRegion(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  topLeft: L.Point,
  canvasSize: L.Point,
  region: FantasyMapTerrainCell
) {
  const rect = projectRegion(map, topLeft, region);
  if (
    rect.x + rect.width < -CANVAS_OVERSCAN_PX ||
    rect.x > canvasSize.x + CANVAS_OVERSCAN_PX ||
    rect.y + rect.height < -CANVAS_OVERSCAN_PX ||
    rect.y > canvasSize.y + CANVAS_OVERSCAN_PX
  ) {
    return;
  }

  const palette = getBiomePalette(region.biome);

  ctx.save();
  traceOrganicRegion(ctx, rect, region, 1.16);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = palette.accent;
  ctx.fill();

  traceOrganicRegion(ctx, rect, region, 1.04);
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = adjustColor(
    palette.base,
    Math.round((region.variation - 0.5) * 10)
  );
  ctx.fill();

  ctx.save();
  traceOrganicRegion(ctx, rect, region, 1.06);
  ctx.clip();

  const glow = ctx.createRadialGradient(
    rect.x + rect.width * (0.35 + region.variation * 0.28),
    rect.y + rect.height * (0.3 + (1 - region.variation) * 0.25),
    0,
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    Math.max(rect.width, rect.height) * 0.72
  );
  glow.addColorStop(0, palette.highlight);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = glow;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

  if (Math.min(rect.width, rect.height) >= DETAILED_REGION_MIN_PX) {
    drawGroundTexture(ctx, rect, palette, region);
    drawPaperGrain(ctx, rect, region);
  }

  ctx.restore();
  ctx.restore();
}

function drawFantasyTerrain(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  dpr: number
) {
  const { size, topLeft } = getCanvasViewport(map);
  const bounds = map.getBounds().pad(0.38);
  const regions = getFantasyAtlasTerrainCells({
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast(),
  });

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size.x, size.y);

  const parchment = ctx.createLinearGradient(0, 0, size.x, size.y);
  parchment.addColorStop(0, "#11120e");
  parchment.addColorStop(0.52, "#171810");
  parchment.addColorStop(1, "#0d110d");
  ctx.fillStyle = parchment;
  ctx.fillRect(0, 0, size.x, size.y);

  for (const region of regions) {
    drawTerrainRegion(ctx, map, topLeft, size, region);
  }

  drawWorldContourInk(ctx, size, topLeft);
}

export default function FantasyTerrainOverlay({
  enabled,
  streetReference,
}: FantasyTerrainOverlayProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const redrawRef = useRef<(() => void) | null>(null);
  const streetReferenceRef = useRef(streetReference);

  streetReferenceRef.current = streetReference;

  useLayoutEffect(() => {
    if (!enabled) {
      map.getPane(PANE_NAME)?.replaceChildren();
      canvasRef.current = null;
      redrawRef.current = null;
      return;
    }

    let pane = map.getPane(PANE_NAME);
    if (!pane) pane = map.createPane(PANE_NAME);
    pane.style.zIndex = PANE_Z_INDEX;
    pane.style.pointerEvents = "none";

    const canvas = document.createElement("canvas");
    canvas.className = "fantasy-terrain-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.opacity = streetReferenceRef.current
      ? STREET_REFERENCE_OPACITY
      : NORMAL_OPACITY;
    canvasRef.current = canvas;
    let active = true;

    const drawNow = () => {
      const element = canvasRef.current;
      if (!active || !element) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      positionCanvas(map, element, dpr);
      const ctx = element.getContext("2d");
      if (!ctx) return;
      drawFantasyTerrain(ctx, map, dpr);
    };

    const redraw = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        drawNow();
      });
    };

    redrawRef.current = redraw;
    drawNow();
    pane.replaceChildren(canvas);

    map.on("move", redraw);
    map.on("moveend", redraw);
    map.on("zoom", redraw);
    map.on("zoomend", redraw);
    map.on("zoomanim", redraw);
    map.on("viewreset", redraw);
    map.on("resize", redraw);

    return () => {
      active = false;
      map.off("move", redraw);
      map.off("moveend", redraw);
      map.off("zoom", redraw);
      map.off("zoomend", redraw);
      map.off("zoomanim", redraw);
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
  }, [enabled, map]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    canvas.style.opacity = streetReference
      ? STREET_REFERENCE_OPACITY
      : NORMAL_OPACITY;
  }, [enabled, streetReference]);

  return null;
}
