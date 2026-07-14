"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  appendExploreEvents,
  appendSetCompleteEvents,
  appendTaskCompleteEvents,
} from "@/lib/activity-log";
import {
  applyActivePerksToEncounter,
  getDepotDoor,
  tryClaimDepotDoor,
} from "@/lib/base-camp";
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
import type {
  EncounterApproachId,
  EncounterResult,
  GameState,
  Item,
  ItemRarity,
  POI,
  Position,
} from "@/lib/types";
import {
  getEncounterApproaches,
  rollEncounter,
  type PendingEncounter,
} from "@/lib/encounter";
import { canExplorePoi } from "@/lib/explore-validation";
import { salvageCommonTriplet as salvageCommonTripletFromLib } from "@/lib/duplicate-salvage";
import { feedback } from "@/lib/feedback/manager";

const RARITY_RANK: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
};

function bestRarity(loot: Item[]): ItemRarity {
  return loot.reduce<ItemRarity>(
    (best, item) =>
      RARITY_RANK[item.rarity] > RARITY_RANK[best] ? item.rarity : best,
    "common"
  );
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [lastEncounter, setLastEncounter] = useState<EncounterResult | null>(
    null
  );
  const [pendingEncounter, setPendingEncounter] =
    useState<PendingEncounter | null>(null);
  const pendingEncounterRef = useRef<PendingEncounter | null>(null);

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
    (poi: POI, playerPosition: Position, options?: { simulate?: boolean }) => {
      if (!gameState) return null;

      const validation = canExplorePoi(
        playerPosition,
        poi,
        gameState.visitedPOIIds,
        options
      );
      if (!validation.ok) return null;

      const pending: PendingEncounter = {
        poi,
        approaches: getEncounterApproaches(poi),
        simulate: options?.simulate === true,
      };

      pendingEncounterRef.current = pending;
      setPendingEncounter(pending);
      setLastEncounter(null);
      return pending;
    },
    [gameState]
  );

  const resolveEncounter = useCallback(
    (approachId: EncounterApproachId) => {
      const pending = pendingEncounterRef.current;
      if (
        !gameState ||
        !pending ||
        !pending.approaches.some((approach) => approach.id === approachId)
      ) {
        return null;
      }

      // Consume the pending encounter synchronously before any state writes.
      // A double tap therefore cannot resolve or reward the same site twice.
      pendingEncounterRef.current = null;
      setPendingEncounter(null);

      const { poi } = pending;
      if (!pending.simulate && gameState.visitedPOIIds.includes(poi.id)) {
        return null;
      }

      let encounter = rollEncounter(poi, approachId);

      const perkResult = applyActivePerksToEncounter(
        encounter,
        poi,
        gameState.baseCamp,
        `${poi.id}:${approachId}`
      );
      encounter = perkResult.encounter;
      const baseCamp = perkResult.baseCamp;

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
        perkBonusXp:
          perkResult.perkBonusXp > 0 ? perkResult.perkBonusXp : undefined,
        perkMessages:
          perkResult.perkMessages.length > 0
            ? perkResult.perkMessages
            : undefined,
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
          baseCamp,
          activityLog,
          fieldTasks: withTasks,
          fieldReport: withFieldReport,
        },
        poi.id
      );

      persist(nextState);
      setLastEncounter(encounterWithDiscoveries);

      // Game feel — presentation only. Emitted after state is committed so the
      // FeedbackManager never influences gameplay or save data.
      if (encounter.loot.length > 0) {
        feedback.emitPickup(
          bestRarity(encounter.loot),
          encounter.loot.length,
          newCodexItemKeys.length > 0
        );
      }
      feedback.emitXp(encounter.xpGained, "encounter");
      if (setBonusXp > 0) feedback.emitXp(setBonusXp, "set");
      if (taskRewardXp > 0) feedback.emitXp(taskRewardXp, "contract");
      if (player.level > prevLevel) feedback.emitLevelUp(player.level);

      return encounterWithDiscoveries;
    },
    [gameState, persist]
  );

  const cancelPendingEncounter = useCallback(() => {
    pendingEncounterRef.current = null;
    setPendingEncounter(null);
  }, []);

  const refreshFieldTasks = useCallback(() => {
    if (!gameState) return;
    persist({
      ...gameState,
      fieldTasks: rollFieldTasks(gameState.codex),
    });
  }, [gameState, persist]);

  const salvageCommonTriplet = useCallback(
    (catalogKey: string) => {
      if (!gameState) return false;

      const result = salvageCommonTripletFromLib(
        gameState.player,
        catalogKey
      );
      if (!result) return false;

      const prevLevel = gameState.player.level;
      const player = applyXp(result.player, result.xpGained);
      const timestamp = new Date().toISOString();

      let activityLog = [
        ...gameState.activityLog,
        {
          id: `act-${timestamp}-xp_gained-salvage`,
          timestamp,
          type: "xp_gained" as const,
          message: `Salvaged ${result.removedCount} commons for ${result.xpGained} XP`,
        },
      ];

      if (player.level > prevLevel) {
        activityLog = [
          ...activityLog,
          {
            id: `act-${timestamp}-level_up-salvage`,
            timestamp,
            type: "level_up" as const,
            message: `Reached level ${player.level}!`,
          },
        ];
      }

      persist({
        ...gameState,
        player,
        activityLog: activityLog.slice(-50),
      });

      feedback.emitXp(result.xpGained, "salvage");
      feedback.emitToast({
        title: `Salvaged ×${result.removedCount}`,
        subtitle: `+${result.xpGained} XP`,
        rarity: "common",
        glyph: "♻",
      });
      if (player.level > prevLevel) feedback.emitLevelUp(player.level);
      return true;
    },
    [gameState, persist]
  );

  const claimDepotDoor = useCallback(
    (doorId: string) => {
      if (!gameState) return false;

      const nextBaseCamp = tryClaimDepotDoor(
        gameState.codex,
        gameState.baseCamp,
        doorId
      );
      if (!nextBaseCamp) return false;

      const door = getDepotDoor(doorId);
      const timestamp = new Date().toISOString();

      persist({
        ...gameState,
        baseCamp: nextBaseCamp,
        activityLog: [
          ...gameState.activityLog,
          {
            id: `act-${timestamp}-door_opened-${doorId}`,
            timestamp,
            type: "door_opened" as const,
            message: door
              ? `Opened ${door.name} — ${door.perkName} loaded for the field`
              : "Opened a depot door",
          },
        ].slice(-50),
      });

      feedback.emitToast({
        title: door ? door.name : "Depot door opened",
        subtitle: door ? `${door.perkName} loaded` : "Perk loaded",
        rarity: "uncommon",
        glyph: "🗝",
      });
      return true;
    },
    [gameState, persist]
  );

  const markBaseCampVisit = useCallback(() => {
    if (!gameState) return;
    persist({
      ...gameState,
      baseCamp: {
        ...gameState.baseCamp,
        lastCampVisitAt: new Date().toISOString(),
      },
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
    pendingEncounterRef.current = null;
    setGameState(fresh);
    setPendingEncounter(null);
    setLastEncounter(null);
    setSaveWarning(null);
  }, []);

  const clearSaveWarning = useCallback(() => {
    setSaveWarning(null);
  }, []);

  return {
    gameState,
    saveWarning,
    pendingEncounter,
    lastEncounter,
    explorePoi,
    resolveEncounter,
    cancelPendingEncounter,
    refreshFieldTasks,
    salvageCommonTriplet,
    claimDepotDoor,
    markBaseCampVisit,
    resetFieldReport,
    clearEncounter,
    clearSaveWarning,
    reset,
    isVisited: (poiId: string) =>
      gameState?.visitedPOIIds.includes(poiId) ?? false,
  };
}
