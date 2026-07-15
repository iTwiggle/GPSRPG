import { describe, expect, it } from "vitest";
import type { EncounterResult } from "@/lib/types";
import {
  encounterReportDismissMs,
  ROUTINE_REPORT_DISMISS_MS,
} from "./encounter-report";

function encounter(overrides: Partial<EncounterResult> = {}): EncounterResult {
  return {
    title: "Scavenged cache",
    description: "You found useful supplies.",
    xpGained: 10,
    loot: [],
    ...overrides,
  } as EncounterResult;
}

describe("compact encounter report", () => {
  it("auto-dismisses routine reports", () => {
    expect(encounterReportDismissMs(encounter())).toBe(
      ROUTINE_REPORT_DISMISS_MS
    );
  });

  it("keeps rare pulls and discoveries until explicitly dismissed", () => {
    expect(
      encounterReportDismissMs(
        encounter({
          loot: [
            {
              id: "rare-item",
              name: "Moon Glass",
              type: "material",
              rarity: "rare",
            },
          ],
        })
      )
    ).toBeNull();
    expect(
      encounterReportDismissMs(
        encounter({ newCodexItemKeys: ["material:moon-glass"] })
      )
    ).toBeNull();
  });

  it("keeps completed-set reports until explicitly dismissed", () => {
    expect(
      encounterReportDismissMs(encounter({ completedSetIds: ["field-kit"] }))
    ).toBeNull();
  });
});
