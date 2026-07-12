import { describe, expect, it } from "vitest";
import { getMapPoiTapAction } from "./map-poi-interaction";

describe("getMapPoiTapAction", () => {
  it("selects a newly tapped POI even when it is already eligible to explore", () => {
    expect(getMapPoiTapAction(null, "poi-a", true)).toBe("select");
    expect(getMapPoiTapAction("poi-b", "poi-a", true)).toBe("select");
  });

  it("explores only on a second tap of the same eligible POI", () => {
    expect(getMapPoiTapAction("poi-a", "poi-a", true)).toBe("explore");
  });

  it("keeps an ineligible selected POI selected without exploring", () => {
    expect(getMapPoiTapAction("poi-a", "poi-a", false)).toBe("blocked");
  });
});
