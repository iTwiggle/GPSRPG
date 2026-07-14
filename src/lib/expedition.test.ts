import { describe, expect, it } from "vitest";
import { getExpeditionProgress } from "@/lib/expedition";

describe("getExpeditionProgress", () => {
  it("averages each contract equally even when targets use different units", () => {
    expect(
      getExpeditionProgress([
        { progress: 1, target: 2 },
        { progress: 20, target: 100 },
      ])
    ).toBe(35);
  });

  it("clamps progress and handles an empty contract set", () => {
    expect(
      getExpeditionProgress([
        { progress: -2, target: 2 },
        { progress: 150, target: 100 },
      ])
    ).toBe(50);
    expect(getExpeditionProgress([])).toBe(0);
  });
});
