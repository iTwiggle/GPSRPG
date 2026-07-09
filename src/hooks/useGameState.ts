"use client";

import { useCallback, useEffect, useState } from "react";
import {
  appendExploreEvents,
  appendSetCompleteEvents,
  appendTaskCompleteEvents,
} from "@/lib/activity-log";
import {
  getItemSet,
  getNewlyCompletedSetIds,
  getSetRewardXp,
} from "@/lib/item-catalog";
import { recordExplore, codexItemKey } from "@/lib/codex";
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
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [lastEncounter, setLastEncounter] = useState<EncounterResult | null>(
    null
  );

  useEffect(() => {
    const result = loadGameState();
    setGameState(result.state);
    setSaveWarning(result.warning);
  }, []);

  const persist = useCallback((next: GameState) => {
    setGameState(next);
    const result = saveGameState(next);
    setSaveWarning(result.warning);
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

      const newCodexItemKeys = encounter.loot
        .filter((item) => !gameState.codex.items[codexItemKey(item)])
        .map((item) => codexItemKey(item));

      const prevLevel = gameState.player.level;
      const playerAfterEncounter = applyXp(
        gameState.player,
        encounter.xpGained
      );
      let player = addLootToPlayer(playerAfterEncounter, encounter.loot);

      let withCodex = recordExplore(gameState.codex, poi, encounter);
      const newSetIds = getNewlyCompletedSetIds(
        withCodex,
        withCodex.completedSetIds
      );
      const setBonusXp = getSetRewardXp(newSetIds);

      if (newSetIds.length > 0) {
        withCodex = {
          ...withCodex,
          completedSetIds: [...withCodex.completedSetIds, ...newSetIds],
        };
      }

      const encounterWithDiscoveries: EncounterResult = {
        ...encounter,
        newCodexItemKeys,
        completedSetIds: newSetIds,
        setBonusXp: setBonusXp > 0 ? setBonusXp : undefined,
      };

      let activityLog = appendExploreEvents(gameState.activityLog, {
        poi,
        encounter: encounterWithDiscoveries,
        prevLevel,
        newLevel: playerAfterEncounter.level,
      });

      if (setBonusXp > 0) {
        const levelBeforeSets = player.level;
        player = applyXp(player, setBonusXp);
        activityLog = appendSetCompleteEvents(
          activityLog,
          newSetIds
            .map((id) => getItemSet(id))
            .filter((set): set is NonNullable<typeof set> => Boolean(set))
            .map((set) => ({
              id: set.id,
              name: set.name,
              rewardXp: set.rewardXp,
            })),
          levelBeforeSets,
          player.level
        );
      }

      const { tasks: withTasks, completions } = applyExploreToTasks(
        gameState.fieldTasks,
        { poi, encounter: encounterWithDiscoveries }
      );

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
        encounter: encounterWithDiscoveries,
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
      setLastEncounter(encounterWithDiscoveries);
      return encounterWithDiscoveries;
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
    setSaveWarning(null);
  }, []);

  const clearSaveWarning = useCallback(() => {
    setSaveWarning(null);
  }, []);

  return {
    gameState,
    saveWarning,
    lastEncounter,
    explorePoi,
    refreshFieldTasks,
    resetFieldReport,
    clearEncounter,
    clearSaveWarning,
    reset,
    isVisited: (poiId: string) =>
      gameState?.visitedPOIIds.includes(poiId) ?? false,
  };
}
