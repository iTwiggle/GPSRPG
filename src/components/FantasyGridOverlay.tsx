"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import {
  getBiomePalette,
  snapToTileCell,
  tileVariationHash,
  type FantasySurfaceBiome,
} from "@/lib/fantasy-grid-surface";

const PANE_NAME = "fantasyGridPane";
const PANE_Z_INDEX = "350";

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

function drawFantasyGrid(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  biome: FantasySurfaceBiome,
  dpr: number
) {
  const palette = getBiomePalette(biome);
  const size = map.getSize();

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size.x, size.y);

  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, size.x, size.y);

  const bounds = map.getBounds();
  const pad = 0.002;
  const south = bounds.getSouth() - pad;
  const north = bounds.getNorth() + pad;
  const west = bounds.getWest() - pad;
  const east = bounds.getEast() + pad;

  const { latStep, lngStep } = snapToTileCell(bounds.getCenter().lat, bounds.getCenter().lng);
  const startLat = Math.floor(south / latStep) * latStep;

  for (let lat = startLat; lat <= north; lat += latStep) {
    const rowLngStep = lngStep / Math.cos((lat * Math.PI) / 180);
    const startLng = Math.floor(west / rowLngStep) * rowLngStep;

    for (let lng = startLng; lng <= east; lng += rowLngStep) {
      const nw = map.latLngToContainerPoint(L.latLng(lat + latStep, lng));
      const se = map.latLngToContainerPoint(L.latLng(lat, lng + rowLngStep));

      if (se.x < -20 || nw.x > size.x + 20 || se.y < -20 || nw.y > size.y + 20) {
        continue;
      }

      const x = nw.x;
      const y = nw.y;
      const w = se.x - nw.x;
      const h = se.y - nw.y;

      if (w < 2 || h < 2) continue;

      const variation = tileVariationHash(lat, lng);
      const skew = Math.min(4, w * 0.08);
      const fill =
        variation > 0.66
          ? palette.highlight
          : variation > 0.33
            ? palette.accent
            : adjustColor(palette.base, Math.round((variation - 0.5) * 12));

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
  }

  ctx.strokeStyle = "rgba(167, 139, 250, 0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i < size.x; i += 48) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size.y);
    ctx.stroke();
  }
  for (let j = 0; j < size.y; j += 48) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(size.x, j);
    ctx.stroke();
  }
}

export default function FantasyGridOverlay({
  biome,
  enabled,
  streetReference,
}: FantasyGridOverlayProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

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

    const opacity = streetReference ? 0.38 : 0.92;
    canvas.style.opacity = String(opacity);

    const redraw = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        const el = canvasRef.current;
        if (!el) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const size = map.getSize();
        el.width = Math.floor(size.x * dpr);
        el.height = Math.floor(size.y * dpr);
        el.style.width = `${size.x}px`;
        el.style.height = `${size.y}px`;

        const ctx = el.getContext("2d");
        if (!ctx) return;
        drawFantasyGrid(ctx, map, biome, dpr);
      });
    };

    redraw();
    map.on("move", redraw);
    map.on("zoom", redraw);
    map.on("resize", redraw);

    return () => {
      map.off("move", redraw);
      map.off("zoom", redraw);
      map.off("resize", redraw);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      pane?.replaceChildren();
      canvasRef.current = null;
    };
  }, [map, enabled, biome, streetReference]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    canvas.style.opacity = streetReference ? "0.38" : "0.92";
  }, [streetReference, enabled]);

  return null;
}
