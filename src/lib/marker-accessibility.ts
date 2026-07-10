import { getPoiTypeLabel } from "./poi-flavor";
import type { POI } from "./types";

export type MarkerAccessibility =
  | {
      interactive: true;
      label: string;
      selected?: boolean;
    }
  | {
      interactive: false;
    };

interface MarkerWithElement {
  getElement(): HTMLElement | undefined;
}

export function getPoiMarkerLabel(
  poi: Pick<POI, "name" | "type">,
  visited: boolean,
  selected: boolean
): string {
  return [
    `${poi.name}, ${getPoiTypeLabel(poi.type)} point of interest`,
    visited ? "visited" : "not visited",
    selected ? "selected" : "not selected",
  ].join(", ");
}

export function applyMarkerAccessibility(
  marker: MarkerWithElement,
  accessibility: MarkerAccessibility
): void {
  const element = marker.getElement();
  if (!element) return;

  if (accessibility.interactive) {
    element.setAttribute("role", "button");
    element.setAttribute("tabindex", "0");
    element.setAttribute("aria-label", accessibility.label);
    element.setAttribute("title", accessibility.label);
    element.removeAttribute("aria-hidden");

    if (accessibility.selected === undefined) {
      element.removeAttribute("aria-pressed");
    } else {
      element.setAttribute("aria-pressed", String(accessibility.selected));
    }
    return;
  }

  element.setAttribute("aria-hidden", "true");
  element.removeAttribute("aria-label");
  element.removeAttribute("aria-pressed");
  element.removeAttribute("role");
  element.removeAttribute("tabindex");
  element.removeAttribute("title");
}
