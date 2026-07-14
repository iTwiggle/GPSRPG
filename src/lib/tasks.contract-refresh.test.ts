import { describe, expect, it } from "vitest";
import {
  applyFieldTaskRefresh,
  canRefreshFieldTasks,
  getLocalDateString,
  isExpeditionComplete,
} from "./tasks";
import { createInitialState } from "./storage";
import type { FieldTask } from "./types";

function completedTask(id: string): FieldTask {
  return {
    id,
    type: "explore_pois",
    title: "Done",
    description: "Done",
    target: 1,
    progress: 1,
    status: "completed",
    rewardXp: 10,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}

describe("field contract refresh", () => {
  it("detects expedition completion", () => {
    const state = createInitialState();
    expect(isExpeditionComplete(state.fieldTasks)).toBe(false);

    state.fieldTasks = [
      completedTask("a"),
      completedTask("b"),
      completedTask("c"),
    ];
    expect(isExpeditionComplete(state.fieldTasks)).toBe(true);
  });

  it("allows one production refresh per local day", () => {
    const state = createInitialState();
    state.fieldTasks = [
      completedTask("a"),
      completedTask("b"),
      completedTask("c"),
    ];

    expect(canRefreshFieldTasks(state).ok).toBe(true);

    const refreshed = applyFieldTaskRefresh(state);
    expect(refreshed.ok).toBe(true);
    expect(refreshed.state.fieldTasks.every((task) => task.status === "active")).toBe(
      true
    );
    expect(refreshed.state.companionMeta?.lastContractRefreshDate).toBe(
      getLocalDateString()
    );

    const completedAgain = {
      ...refreshed.state,
      fieldTasks: [
        completedTask("x"),
        completedTask("y"),
        completedTask("z"),
      ],
    };
    expect(canRefreshFieldTasks(completedAgain).ok).toBe(false);
    expect(canRefreshFieldTasks(completedAgain).reason).toBe(
      "already_refreshed_today"
    );
  });

  it("lets dev tools bypass the daily gate", () => {
    const state = createInitialState();
    state.fieldTasks = [
      completedTask("a"),
      completedTask("b"),
      completedTask("c"),
    ];
    state.companionMeta = { lastContractRefreshDate: getLocalDateString() };

    expect(canRefreshFieldTasks(state).ok).toBe(false);
    expect(
      canRefreshFieldTasks(state, { bypassDailyLimit: true }).ok
    ).toBe(true);
  });
});
