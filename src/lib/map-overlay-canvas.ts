import L from "leaflet";

/** Resize the backing store only when dimensions change to avoid GPU churn. */
export function positionOverlayCanvas(
  canvas: HTMLCanvasElement,
  size: L.Point,
  topLeft: L.Point,
  dpr: number
): void {
  const pixelWidth = Math.max(1, Math.floor(size.x * dpr));
  const pixelHeight = Math.max(1, Math.floor(size.y * dpr));

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
  }

  L.DomUtil.setPosition(canvas, topLeft);
}
