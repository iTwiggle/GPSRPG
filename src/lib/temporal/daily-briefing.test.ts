import { describe, expect, it } from "vitest";
import { createInitialState } from "../storage";
import {
  buildDailyBriefing,
  markDailyBriefingSeen,
  shouldShowDailyBriefing,
} from "./daily-briefing";

describe("daily briefing", () => {
  it("shows once per local calendar day", () => {
    const state = createInitialState();
    expect(shouldShowDailyBriefing(state, "2026-07-14")).toBe(true);

    const seen = markDailyBriefingSeen(state, "2026-07-14");
    expect(shouldShowDailyBriefing(seen, "2026-07-14")).toBe(false);
    expect(shouldShowDailyBriefing(seen, "2026-07-15")).toBe(true);
  });

  it("includes today's sign and contract snapshot", () => {
    const state = createInitialState();
    const briefing = buildDailyBriefing(state, [], "2026-07-14");

    expect(briefing.date).toBe("2026-07-14");
    expect(briefing.modifier.name).toBeTruthy();
    expect(briefing.highlights[0]?.id).toBe("contracts");
  });
});
