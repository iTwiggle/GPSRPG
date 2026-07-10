import { describe, expect, it } from "vitest";
import {
  applyMarkerAccessibility,
  getPoiMarkerLabel,
} from "./marker-accessibility";

class FakeMarkerElement {
  private attributes = new Map<string, string>();

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }

  hasAttribute(name: string) {
    return this.attributes.has(name);
  }
}

function createMarker(element: FakeMarkerElement | undefined) {
  return {
    getElement: () => element as unknown as HTMLElement | undefined,
  };
}

describe("getPoiMarkerLabel", () => {
  const poi = { name: "Moonlit Altar", type: "shrine" as const };

  it("includes POI identity, type, visited state, and selected state", () => {
    expect(getPoiMarkerLabel(poi, false, false)).toBe(
      "Moonlit Altar, Shrine point of interest, not visited, not selected"
    );
    expect(getPoiMarkerLabel(poi, true, true)).toBe(
      "Moonlit Altar, Shrine point of interest, visited, selected"
    );
  });
});

describe("applyMarkerAccessibility", () => {
  it("makes interactive markers named, button-like, and keyboard focusable", () => {
    const element = new FakeMarkerElement();
    element.setAttribute("aria-hidden", "true");

    applyMarkerAccessibility(createMarker(element), {
      interactive: true,
      label: "Hidden Cache, Cache point of interest, visited, selected",
      selected: true,
    });

    expect(element.getAttribute("role")).toBe("button");
    expect(element.getAttribute("tabindex")).toBe("0");
    expect(element.getAttribute("aria-label")).toBe(
      "Hidden Cache, Cache point of interest, visited, selected"
    );
    expect(element.getAttribute("title")).toBe(
      "Hidden Cache, Cache point of interest, visited, selected"
    );
    expect(element.getAttribute("aria-pressed")).toBe("true");
    expect(element.hasAttribute("aria-hidden")).toBe(false);
  });

  it("updates labels and selected state on the existing marker element", () => {
    const element = new FakeMarkerElement();
    const marker = createMarker(element);

    applyMarkerAccessibility(marker, {
      interactive: true,
      label: "Verdant Grove, Grove point of interest, not visited, not selected",
      selected: false,
    });
    applyMarkerAccessibility(marker, {
      interactive: true,
      label: "Verdant Grove, Grove point of interest, visited, selected",
      selected: true,
    });

    expect(element.getAttribute("aria-label")).toBe(
      "Verdant Grove, Grove point of interest, visited, selected"
    );
    expect(element.getAttribute("title")).toBe(
      "Verdant Grove, Grove point of interest, visited, selected"
    );
    expect(element.getAttribute("aria-pressed")).toBe("true");
  });

  it("hides decorative markers and removes focus and interactive semantics", () => {
    const element = new FakeMarkerElement();
    const marker = createMarker(element);

    applyMarkerAccessibility(marker, {
      interactive: true,
      label: "Player location",
    });
    applyMarkerAccessibility(marker, { interactive: false });

    expect(element.getAttribute("aria-hidden")).toBe("true");
    expect(element.hasAttribute("tabindex")).toBe(false);
    expect(element.hasAttribute("role")).toBe(false);
    expect(element.hasAttribute("aria-label")).toBe(false);
    expect(element.hasAttribute("aria-pressed")).toBe(false);
    expect(element.hasAttribute("title")).toBe(false);
  });

  it("waits safely when Leaflet has not added the marker element yet", () => {
    expect(() =>
      applyMarkerAccessibility(createMarker(undefined), {
        interactive: true,
        label: "Player location",
      })
    ).not.toThrow();
  });
});
