import { describe, expect, it, vi } from "vitest";
import {
  applyMarkerAccessibility,
  buildPoiMarkerAriaLabel,
  PLAYER_MARKER_ARIA_LABEL,
} from "./marker-a11y";
import {
  createPoiMarkerConfig,
  playerMarkerConfig,
} from "./poi-marker-icons";

describe("buildPoiMarkerAriaLabel", () => {
  it("includes POI name and type", () => {
    expect(
      buildPoiMarkerAriaLabel({
        name: "Moonlit Shrine",
        type: "shrine",
        visited: false,
        selected: false,
      })
    ).toBe("Moonlit Shrine, Shrine");
  });

  it("includes visited and selected state", () => {
    expect(
      buildPoiMarkerAriaLabel({
        name: "Bandit Camp",
        type: "camp",
        visited: true,
        selected: true,
        inRange: true,
      })
    ).toBe("Bandit Camp, Camp, explored, selected, in exploration range");
  });

  it("omits in-range text when the marker is not selected", () => {
    expect(
      buildPoiMarkerAriaLabel({
        name: "Hidden Cache",
        type: "cache",
        visited: false,
        selected: false,
        inRange: true,
      })
    ).toBe("Hidden Cache, Cache");
  });
});

describe("applyMarkerAccessibility", () => {
  it("marks interactive markers as buttons with labels and keyboard support", () => {
    const element = document.createElement("div");
    element.className = "poi-marker";
    const onActivate = vi.fn();

    const cleanup = applyMarkerAccessibility(
      element,
      {
        interactive: true,
        ariaLabel: "Moonlit Shrine, Shrine, selected",
        title: "Moonlit Shrine, Shrine, selected",
      },
      { onActivate }
    );

    expect(element.getAttribute("role")).toBe("button");
    expect(element.getAttribute("aria-label")).toBe(
      "Moonlit Shrine, Shrine, selected"
    );
    expect(element.getAttribute("title")).toBe(
      "Moonlit Shrine, Shrine, selected"
    );
    expect(element.tabIndex).toBe(0);
    expect(element.getAttribute("aria-hidden")).toBeNull();

    element.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
    expect(onActivate).toHaveBeenCalledOnce();

    cleanup?.();
  });

  it("hides decorative markers from assistive tech and removes focus", () => {
    const element = document.createElement("div");
    element.className = "player-marker";
    element.setAttribute("role", "button");
    element.tabIndex = 0;

    applyMarkerAccessibility(element, { interactive: false });

    expect(element.getAttribute("aria-hidden")).toBe("true");
    expect(element.getAttribute("role")).toBeNull();
    expect(element.getAttribute("aria-label")).toBeNull();
    expect(element.getAttribute("title")).toBeNull();
    expect(element.tabIndex).toBe(-1);
  });
});

describe("marker configs", () => {
  it("builds player marker accessibility metadata", () => {
    expect(playerMarkerConfig.accessibility).toEqual({
      interactive: true,
      ariaLabel: PLAYER_MARKER_ARIA_LABEL,
      title: PLAYER_MARKER_ARIA_LABEL,
    });
    expect(playerMarkerConfig.icon.options.className).toBe("player-marker");
  });

  it("builds POI marker accessibility metadata from marker state", () => {
    const config = createPoiMarkerConfig(
      { name: "Lonely Tower", type: "tower" },
      { selected: true, visited: true, inRange: false }
    );

    expect(config.accessibility.ariaLabel).toBe(
      "Lonely Tower, Tower, explored, selected"
    );
    expect(config.icon.options.className).toContain("poi-marker--tower");
    expect(config.icon.options.className).toContain("poi-marker--selected");
    expect(config.icon.options.className).toContain("poi-marker--visited");
  });
});
