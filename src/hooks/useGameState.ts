"use client";

import { useCallback, useEffect, useState } from "react";
import {
  appendExploreEvents,
  appendTaskCompleteEvents,
} from "@/lib/activity-log";
import { recordExplore } from "@/lib/codex";
import { applyExploreToTasks, refreshFieldTasks as rollFieldTasks } from "@/lib/tasks";
import { updateFieldReportOnExplore } from "@/lib/field-report";
import { applyXp } from "@/lib/xp";
import {
  addLootToPlayer,
  loadGameState,
  markPoiVisited,
  resetFieldReportInState,
  resetGameState,
  saveGameState,
} from "@/lib/storage";
import type { EncounterResult, GameState, POI } from "@/lib/types";
import { rollEncounter } from "@/lib/encounter";

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastEncounter, setLastEncounter] = useState<EncounterResult | null>(
    null
  );

  useEffect(() => {
    setGameState(loadGameState());
  }, []);

  const persist = useCallback((next: GameState) => {
    setGameState(next);
    saveGameState(next);
  }, []);

  const explorePoi = useCallback(
    (poi: POI, options?: { simulate?: boolean }) => {
      if (!gameState) return null;

      if (gameState.visitedPOIIds.includes(poi.id) && !options?.simulate) {
        return null;
      }

      const encounter = rollEncounter(
        poi,
        options?.simulate ? Date.now() : undefined
      );

      const prevLevel = gameState.player.level;
      const withXp = applyXp(gameState.player, encounter.xpGained);
      const withLoot = addLootToPlayer(withXp, encounter.loot);
      const withCodex = recordExplore(gameState.codex, poi, encounter);
      const withActivity = appendExploreEvents(gameState.activityLog, {
        poi,
        encounter,
        prevLevel,
        newLevel: withXp.level,
      });

      const { tasks: withTasks, completions } = applyExploreToTasks(
        gameState.fieldTasks,
        { poi, encounter }
      );

      let player = withLoot;
      let activityLog = withActivity;
      const taskRewardXp = completions.reduce(
        (sum, task) => sum + task.rewardXp,
        0
      );

      if (completions.length > 0) {
        const levelBeforeRewards = player.level;
        player = applyXp(player, taskRewardXp);
        activityLog = appendTaskCompleteEvents(
          activityLog,
          completions,
          levelBeforeRewards,
          player.level
        );
      }

      const withFieldReport = updateFieldReportOnExplore(gameState.fieldReport, {
        poi,
        encounter,
        taskRewardXp,
        tasksCompleted: completions.length,
      });

      const nextState = markPoiVisited(
        {
          ...gameState,
          player,
          codex: withCodex,
          activityLog,
          fieldTasks: withTasks,
          fieldReport: withFieldReport,
        },
        poi.id
      );

      persist(nextState);
      setLastEncounter(encounter);
      return encounter;
    },
    [gameState, persist]
  );

  const refreshFieldTasks = useCallback(() => {
    if (!gameState) return;
    persist({
      ...gameState,
      fieldTasks: rollFieldTasks(),
    });
  }, [gameState, persist]);

  const clearEncounter = useCallback(() => {
    setLastEncounter(null);
  }, []);

  const resetFieldReport = useCallback(() => {
    if (!gameState) return;
    persist(resetFieldReportInState(gameState));
  }, [gameState, persist]);

  const reset = useCallback(() => {
    const fresh = resetGameState();
    setGameState(fresh);
    setLastEncounter(null);
  }, []);

  return {
    gameState,
    lastEncounter,
    explorePoi,
    refreshFieldTasks,
    resetFieldReport,
    clearEncounter,
    reset,
    isVisited: (poiId: string) =>
      gameState?.visitedPOIIds.includes(poiId) ?? false,
  };
}
