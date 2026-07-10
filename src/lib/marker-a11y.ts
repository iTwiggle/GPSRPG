import { getPoiTypeLabel } from "./poi-flavor";
import type { POIType } from "./types";

export const PLAYER_MARKER_ARIA_LABEL = "Your position";

export interface PoiMarkerA11yInput {
  name: string;
  type: POIType;
  visited: boolean;
  selected: boolean;
  inRange?: boolean;
}

export interface MarkerAccessibilityState {
  interactive: boolean;
  ariaLabel?: string;
  title?: string;
}

export interface ApplyMarkerAccessibilityOptions {
  onActivate?: () => void;
}

const KEYBOARD_ACTIVATION_KEYS = new Set(["Enter", " "]);

export function buildPoiMarkerAriaLabel(input: PoiMarkerA11yInput): string {
  const typeLabel = getPoiTypeLabel(input.type);
  const parts = [`${input.name}, ${typeLabel}`];

  if (input.visited) {
    parts.push("explored");
  }
  if (input.selected) {
    parts.push("selected");
    if (input.inRange) {
      parts.push("in exploration range");
    }
  }

  return parts.join(", ");
}

export function buildMarkerAccessibilityState(
  ariaLabel: string,
  interactive = true
): MarkerAccessibilityState {
  return {
    interactive,
    ariaLabel,
    title: ariaLabel,
  };
}

export function applyMarkerAccessibility(
  element: HTMLElement | null | undefined,
  state: MarkerAccessibilityState,
  options: ApplyMarkerAccessibilityOptions = {}
): (() => void) | undefined {
  if (!element) return undefined;

  const { interactive, ariaLabel, title } = state;

  if (interactive) {
    element.setAttribute("role", "button");
    element.tabIndex = 0;
    element.removeAttribute("aria-hidden");

    if (ariaLabel) {
      element.setAttribute("aria-label", ariaLabel);
    } else {
      element.removeAttribute("aria-label");
    }

    const tooltip = title ?? ariaLabel;
    if (tooltip) {
      element.setAttribute("title", tooltip);
    } else {
      element.removeAttribute("title");
    }

    if (!options.onActivate) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!KEYBOARD_ACTIVATION_KEYS.has(event.key)) return;
      event.preventDefault();
      options.onActivate?.();
    };

    element.addEventListener("keydown", onKeyDown);
    return () => element.removeEventListener("keydown", onKeyDown);
  }

  element.setAttribute("aria-hidden", "true");
  element.removeAttribute("role");
  element.removeAttribute("aria-label");
  element.removeAttribute("title");
  element.tabIndex = -1;

  return undefined;
}

export function syncMarkerAccessibility(
  marker: { getElement: () => HTMLElement | null | undefined },
  state: MarkerAccessibilityState,
  options: ApplyMarkerAccessibilityOptions = {}
): (() => void) | undefined {
  return applyMarkerAccessibility(marker.getElement(), state, options);
}
