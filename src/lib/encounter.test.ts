import { describe, expect, it } from "vitest";
import { getEncounterApproaches, rollEncounter } from "./encounter";
import { POI_TYPES } from "./poi-flavor";
import type { POI, POIType } from "./types";

function makePoi(type: POIType, index = 0): POI {
  return {
    id: `choice-test-${type}-${index}`,
    name: `Test ${type} ${index}`,
    type,
    flavor: `A ${type} prepared for an encounter choice test.`,
    lat: 41.4993,
    lng: -81.6944,
  };
}

describe("getEncounterApproaches", () => {
  it("gives every site type one measured and one bold action", () => {
    const labels = new Set<string>();

    for (const type of POI_TYPES) {
      const approaches = getEncounterApproaches(makePoi(type));

      expect(approaches.map((approach) => approach.id)).toEqual([
        "survey",
        "delve",
      ]);
      expect(approaches.map((approach) => approach.tone)).toEqual([
        "safe",
        "risky",
      ]);
      for (const approach of approaches) {
        expect(approach.label.length).toBeGreaterThan(3);
        expect(approach.description.length).toBeGreaterThan(20);
        expect(approach.tradeoff.length).toBeGreaterThan(10);
        labels.add(approach.label);
      }
    }

    expect(labels.size).toBe(POI_TYPES.length * 2);
  });
});

describe("rollEncounter choices", () => {
  it("locks each POI and approach to a deterministic result", () => {
    for (const type of POI_TYPES) {
      for (const approachId of ["survey", "delve"] as const) {
        const poi = makePoi(type, 7);
        expect(rollEncounter(poi, approachId)).toEqual(
          rollEncounter(poi, approachId)
        );
      }
    }
  });

  it("keeps the measured approach dependable and loot-restrained", () => {
    for (const type of POI_TYPES) {
      for (let index = 0; index < 32; index += 1) {
        const result = rollEncounter(makePoi(type, index), "survey");

        expect(result.approachId).toBe("survey");
        expect(result.approachOutcome).toBe("steady");
        expect(result.xpGained).toBeGreaterThanOrEqual(15);
        expect(result.loot.length).toBeLessThanOrEqual(1);
        for (const item of result.loot) {
          expect(item.id).toContain("-survey-");
        }
      }
    }
  });

  it("gives the bold approach both real setbacks and higher payoffs", () => {
    let setbacks = 0;
    let payoffs = 0;
    let multiLootPayoffs = 0;

    for (const type of POI_TYPES) {
      for (let index = 0; index < 48; index += 1) {
        const result = rollEncounter(makePoi(type, index), "delve");

        expect(result.approachId).toBe("delve");
        if (result.approachOutcome === "setback") {
          setbacks += 1;
          expect(result.loot).toHaveLength(0);
        } else {
          payoffs += 1;
          expect(result.approachOutcome).toBe("payoff");
          expect(result.loot.length).toBeGreaterThanOrEqual(1);
          if (result.loot.length > 1) multiLootPayoffs += 1;
          for (const item of result.loot) {
            expect(item.id).toContain("-delve-");
          }
        }
      }
    }

    expect(setbacks).toBeGreaterThan(0);
    expect(payoffs).toBeGreaterThan(0);
    expect(multiLootPayoffs).toBeGreaterThan(0);
  });

  it("uses the choice as part of the outcome seed", () => {
    let differentResults = 0;

    for (const type of POI_TYPES) {
      for (let index = 0; index < 16; index += 1) {
        const poi = makePoi(type, index);
        const survey = rollEncounter(poi, "survey");
        const delve = rollEncounter(poi, "delve");

        if (
          survey.title !== delve.title ||
          survey.xpGained !== delve.xpGained ||
          survey.loot.length !== delve.loot.length
        ) {
          differentResults += 1;
        }
      }
    }

    expect(differentResults).toBeGreaterThan(POI_TYPES.length);
  });
});
