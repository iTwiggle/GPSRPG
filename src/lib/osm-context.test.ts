import { describe, expect, it } from "vitest";
import { classifyOsmElements } from "./osm-context";

describe("osm-context marsh classification", () => {
  it("classifies natural=wetland as marsh, not water", () => {
    const category = classifyOsmElements([
      { tags: { natural: "wetland" } },
    ]);

    expect(category).toBe("marsh");
  });

  it("prefers marsh over generic water when both appear", () => {
    const category = classifyOsmElements([
      { tags: { natural: "water" } },
      { tags: { natural: "wetland" } },
      { tags: { natural: "wetland" } },
    ]);

    expect(category).toBe("marsh");
  });
});
