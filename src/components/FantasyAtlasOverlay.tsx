"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import {
  getFantasyAtlasPlacements,
  type FantasyMapMotif,
} from "@/lib/fantasy-map-art";

const PANE_NAME = "fantasyAtlasPane";
const PANE_Z_INDEX = "350";

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

function positionCanvas(map: L.Map, canvas: HTMLCanvasElement, dpr: number) {
  const size = map.getSize();
  const topLeft = map.containerPointToLayerPoint(L.point(0, 0));

  canvas.width = Math.max(1, Math.floor(size.x * dpr));
  canvas.height = Math.max(1, Math.floor(size.y * dpr));
  canvas.style.width = `${size.x}px`;
  canvas.style.height = `${size.y}px`;
  L.DomUtil.setPosition(canvas, topLeft);
}

function zoomScale(zoom: number): number {
  return Math.min(1.55, Math.max(0.72, Math.pow(2, (zoom - 16) * 0.28)));
}

interface FantasyAtlasOverlayProps {
  enabled: boolean;
  streetReference: boolean;
}

export default function FantasyAtlasOverlay({
  enabled,
  streetReference,
}: FantasyAtlasOverlayProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      const existing = map.getPane(PANE_NAME);
      existing?.replaceChildren();
      canvasRef.current = null;
      return;
    }

    const mapFrame = map.getContainer().closest(".rpg-map-frame");
    const scannerOverlay = mapFrame?.querySelector<HTMLElement>(
      ".rpg-scanner-overlay"
    );
    const previousScannerDisplay = scannerOverlay?.style.display ?? "";
    if (scannerOverlay) scannerOverlay.style.display = "none";

    let pane = map.getPane(PANE_NAME);
    if (!pane) {
      pane = map.createPane(PANE_NAME);
      pane.style.zIndex = PANE_Z_INDEX;
      pane.style.pointerEvents = "none";
    }

    const canvas = document.createElement("canvas");
    canvas.className = "fantasy-atlas-canvas";
    canvas.setAttribute("aria-hidden", "true");
    pane.replaceChildren(canvas);
    canvasRef.current = canvas;

    const images = new Map<FantasyMapMotif, HTMLImageElement>();

    const redraw = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const el = canvasRef.current;
        if (!el) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        positionCanvas(map, el, dpr);
        const ctx = el.getContext("2d");
        if (!ctx) return;

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

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size.x, size.y);
        ctx.imageSmoothingEnabled = true;

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

          ctx.save();
          ctx.translate(point.x, point.y);
          ctx.rotate((placement.rotationDegrees * Math.PI) / 180);
          ctx.globalAlpha =
            placement.opacity * (streetReference ? 0.16 : 1);
          ctx.drawImage(image, -width / 2, -height / 2, width, height);
          ctx.restore();
        }
      });
    };

    for (const [motif, src] of Object.entries(MOTIF_ASSETS) as Array<
      [FantasyMapMotif, string]
    >) {
      const image = new Image();
      image.onload = redraw;
      image.src = src;
      images.set(motif, image);
    }

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
      if (scannerOverlay) scannerOverlay.style.display = previousScannerDisplay;
    };
  }, [enabled, map, streetReference]);

  return null;
}
