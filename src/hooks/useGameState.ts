"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACTIVITY_LOG_MAX,
  appendExploreEvents,
  appendSetCompleteEvents,
  appendTaskCompleteEvents,
} from "@/lib/activity-log";
import {
  applyActivePerksToEncounter,
  getDepotDoor,
  tryClaimDepotDoor,
} from "@/lib/base-camp";
import { catalogItemKey } from "@/lib/catalog-key";
import { recordExplore } from "@/lib/codex";
import { salvageCommonTriplet as salvageCommonTripletFromLib } from "@/lib/duplicate-salvage";
import { rollEncounter } from "@/lib/encounter";
import { updateFieldReportOnExplore } from "@/lib/field-report";
import {
  getItemSet,
  getNewlyCompletedSetIds,
  getSetRewardXp,
} from "@/lib/item-catalog";
import {
  addLootToPlayer,
  loadGameState,
  markPoiVisited,
  resetFieldReportInState,
  resetGameState,
  saveGameState,
} from "@/lib/storage";
import { applyExploreToTasks, refreshFieldTasks as rollFieldTasks } from "@/lib/tasks";
import type { EncounterResult, GameState, POI } from "@/lib/types";
import { applyXp } from "@/lib/xp";

function prependActivityEvents(
  log: GameState["activityLog"],
  events: GameState["activityLog"]
): GameState["activityLog"] {
  const next = [...events, ...log];
  if (next.length > ACTIVITY_LOG_MAX) {
    next.length = ACTIVITY_LOG_MAX;
  }
  return next;
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [lastEncounter, setLastEncounter] = useState<EncounterResult | null>(
    null
  );
  const stateRef = useRef<GameState | null>(null);

  useEffect(() => {
    const result = loadGameState();
    stateRef.current = result.state;
    setGameState(result.state);
    setSaveWarning(result.warning);
  }, []);

  const persist = useCallback((next: GameState) => {
    stateRef.current = next;
    setGameState(next);
    const result = saveGameState(next);
    setSaveWarning(result.warning);
  }, []);

  const explorePoi = useCallback(
    (poi: POI, options?: { simulate?: boolean }) => {
      const current = stateRef.current;
      if (!current) return null;

      if (current.visitedPOIIds.includes(poi.id) && !options?.simulate) {
        return null;
      }

      const rollSeed = options?.simulate ? Date.now() : undefined;
      let encounter = rollEncounter(poi, rollSeed);

      const perkResult = applyActivePerksToEncounter(
        encounter,
        poi,
        current.baseCamp,
        rollSeed ?? poi.id
      );
      encounter = perkResult.encounter;
      const baseCamp = perkResult.baseCamp;

      const newCodexItemKeys = encounter.loot
        .filter((item) => !current.codex.items[catalogItemKey(item)])
        .map((item) => catalogItemKey(item));

      const prevLevel = current.player.level;
      const playerAfterEncounter = applyXp(current.player, encounter.xpGained);
      let player = addLootToPlayer(playerAfterEncounter, encounter.loot);

      let withCodex = recordExplore(current.codex, poi, encounter);
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
        perkBonusXp:
          perkResult.perkBonusXp > 0 ? perkResult.perkBonusXp : undefined,
        perkMessages:
          perkResult.perkMessages.length > 0
            ? perkResult.perkMessages
            : undefined,
      };

      let activityLog = appendExploreEvents(current.activityLog, {
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
        current.fieldTasks,
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

      const withFieldReport = updateFieldReportOnExplore(current.fieldReport, {
        poi,
        encounter: encounterWithDiscoveries,
        taskRewardXp,
        setBonusXp,
        tasksCompleted: completions.length,
      });

      const nextState = markPoiVisited(
        {
          ...current,
          player,
          codex: withCodex,
          baseCamp,
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
    [persist]
  );

  const refreshFieldTasks = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    persist({
      ...current,
      fieldTasks: rollFieldTasks(current.codex),
    });
  }, [persist]);

  const salvageCommonTriplet = useCallback(
    (catalogKey: string) => {
      const current = stateRef.current;
      if (!current) return false;

      const result = salvageCommonTripletFromLib(current.player, catalogKey);
      if (!result) return false;

      const prevLevel = current.player.level;
      const player = applyXp(result.player, result.xpGained);
      const timestamp = new Date().toISOString();

      const events: GameState["activityLog"] = [
        {
          id: `act-${timestamp}-xp_gained-salvage`,
          timestamp,
          type: "xp_gained",
          message: `Salvaged ${result.removedCount} commons for ${result.xpGained} XP`,
        },
      ];

      if (player.level > prevLevel) {
        events.push({
          id: `act-${timestamp}-level_up-salvage`,
          timestamp,
          type: "level_up",
          message: `Reached Level ${player.level}`,
        });
      }

      persist({
        ...current,
        player,
        activityLog: prependActivityEvents(current.activityLog, events),
        fieldReport: {
          ...current.fieldReport,
          xpGained: current.fieldReport.xpGained + result.xpGained,
        },
      });
      return true;
    },
    [persist]
  );

  const claimDepotDoor = useCallback(
    (doorId: string) => {
      const current = stateRef.current;
      if (!current) return false;

      const nextBaseCamp = tryClaimDepotDoor(
        current.codex,
        current.baseCamp,
        doorId
      );
      if (!nextBaseCamp) return false;

      const door = getDepotDoor(doorId);
      const timestamp = new Date().toISOString();

      persist({
        ...current,
        baseCamp: nextBaseCamp,
        activityLog: prependActivityEvents(current.activityLog, [
          {
            id: `act-${timestamp}-door_opened-${doorId}`,
            timestamp,
            type: "door_opened",
            message: door
              ? `Opened ${door.name} — ${door.perkName} loaded for the field`
              : "Opened a depot door",
          },
        ]),
      });
      return true;
    },
    [persist]
  );

  const markBaseCampVisit = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    persist({
      ...current,
      baseCamp: {
        ...current.baseCamp,
        lastCampVisitAt: new Date().toISOString(),
      },
    });
  }, [persist]);

  const clearEncounter = useCallback(() => {
    setLastEncounter(null);
  }, []);

  const resetFieldReport = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    persist(resetFieldReportInState(current));
  }, [persist]);

  const reset = useCallback(() => {
    const fresh = resetGameState();
    stateRef.current = fresh;
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
    salvageCommonTriplet,
    claimDepotDoor,
    markBaseCampVisit,
    resetFieldReport,
    clearEncounter,
    clearSaveWarning,
    reset,
    isVisited: (poiId: string) =>
      stateRef.current?.visitedPOIIds.includes(poiId) ??
      gameState?.visitedPOIIds.includes(poiId) ??
      false,
  };
}
