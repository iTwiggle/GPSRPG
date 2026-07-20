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
import { applyExploreToTasks, applyFieldTaskRefresh } from "@/lib/tasks";
import { updateFieldReportOnExplore } from "@/lib/field-report";
import { applyXp } from "@/lib/xp";
import {
  addLootToPlayer,
  loadGameState,
  recordPoiExplore,
  resetFieldReportInState,
  resetGameState,
  saveGameState,
  updateMovementLedger,
} from "@/lib/storage";
import { sampleMovementLedger, recordOutingCompleted } from "@/lib/movement/movement-ledger";
import {
  applyTrailSurgeXp,
  getTrailMomentumStatus,
  SCOUTS_EYE_REVEAL_BONUS_METERS,
} from "@/lib/movement/trail-momentum";
import { getPoiVisitUiStatus } from "@/lib/temporal/poi-cooldowns";
import type {
  EncounterResult,
  GameState,
  Item,
  ItemRarity,
  POI,
  Position,
} from "@/lib/types";
import { rollEncounter } from "@/lib/encounter";
import { canExplorePoi } from "@/lib/explore-validation";
import { salvageCommonTriplet as salvageCommonTripletFromLib } from "@/lib/duplicate-salvage";
import { feedback } from "@/lib/feedback/manager";
import { tryDrinkHealingDraught } from "@/lib/companion/clear-sight";
import { tryCraftSanctumRecipe } from "@/lib/companion/sanctum-craft";
import { markFootfallSeen as markFootfallSeenInState } from "@/lib/world/cell-arrival";
import type { OsmContextCategory } from "@/lib/osm-context";

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
  const gameStateRef = useRef<GameState | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [lastEncounter, setLastEncounter] = useState<EncounterResult | null>(
    null
  );

  useEffect(() => {
    const result = loadGameState();
    gameStateRef.current = result.state;
    setGameState(result.state);
    setSaveWarning(result.warning);
  }, []);

  const persist = useCallback((next: GameState) => {
    gameStateRef.current = next;
    setGameState(next);
    const result = saveGameState(next);
    setSaveWarning(result.warning);
  }, []);

  const explorePoi = useCallback(
    (
      poi: POI,
      playerPosition: Position,
      options?: {
        simulate?: boolean;
        areaContext?: OsmContextCategory;
        trailSurgePreview?: boolean;
      }
    ) => {
      // Read the synchronously updated ref so two taps arriving before React's
      // next render cannot both resolve against the same pre-visit snapshot.
      const current = gameStateRef.current;
      if (!current) return null;

      const validation = canExplorePoi(
        playerPosition,
        poi,
        current.visitedPois,
        options
      );
      if (!validation.ok) return null;

      const rollSeed = options?.simulate ? Date.now() : undefined;
      let encounter = rollEncounter(
        poi,
        rollSeed,
        options?.areaContext ?? "generic"
      );

      const perkResult = applyActivePerksToEncounter(
        encounter,
        poi,
        current.baseCamp,
        rollSeed ?? poi.id
      );
      encounter = perkResult.encounter;
      const baseCamp = perkResult.baseCamp;
      const trailSurgeResult = applyTrailSurgeXp(
        encounter,
        current.movementLedger,
        options?.trailSurgePreview
      );
      encounter = trailSurgeResult.encounter;

      const newCodexItemKeys = encounter.loot
        .filter((item) => !current.codex.items[codexItemKey(item)])
        .map((item) => codexItemKey(item));

      const prevLevel = current.player.level;
      const playerAfterEncounter = applyXp(
        current.player,
        encounter.xpGained
      );
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
          perkResult.perkBonusXp + trailSurgeResult.bonusXp > 0
            ? perkResult.perkBonusXp + trailSurgeResult.bonusXp
            : undefined,
        perkMessages:
          perkResult.perkMessages.length > 0 || trailSurgeResult.message
            ? [
                ...perkResult.perkMessages,
                ...(trailSurgeResult.message
                  ? [trailSurgeResult.message]
                  : []),
              ]
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
        tasksCompleted: completions.length,
      });

      const nextState = recordPoiExplore(
        {
          ...current,
          player,
          codex: withCodex,
          baseCamp,
          activityLog,
          fieldTasks: withTasks,
          fieldReport: withFieldReport,
        },
        poi
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
    [persist]
  );

  const refreshFieldTasks = useCallback(
    (options?: { bypassDailyLimit?: boolean }) => {
      if (!gameState) return false;

      const result = applyFieldTaskRefresh(gameState, options);
      if (!result.ok) return false;

      persist(result.state);
      feedback.emitToast({
        title: "New field contracts",
        subtitle: "Three fresh goals for your next outing",
        rarity: "uncommon",
        glyph: "📜",
      });
      return true;
    },
    [gameState, persist]
  );

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
    const hadProgress = gameState.fieldReport.sitesExplored > 0;
    let next = resetFieldReportInState(gameState);
    if (hadProgress) {
      next = updateMovementLedger(
        next,
        recordOutingCompleted(next.movementLedger)
      );
    }
    persist(next);
  }, [gameState, persist]);

  const samplePlayerMovement = useCallback(
    (position: Position, accuracyMeters: number, source: "live" | "demo") => {
      const current = gameStateRef.current;
      if (!current) return;
      const nextLedger = sampleMovementLedger(current.movementLedger, position, new Date().toISOString(), { accuracyMeters, source });
      const next = updateMovementLedger(current, nextLedger);
      gameStateRef.current = next;
      if (nextLedger.totalMeters > current.movementLedger.totalMeters) {
        const wasActive = getTrailMomentumStatus(current.movementLedger).scoutsEyeActive;
        const previousStatus = getTrailMomentumStatus(current.movementLedger);
        const nextStatus = getTrailMomentumStatus(nextLedger);
        const isActive = nextStatus.scoutsEyeActive;
        persist(next);
        if (!wasActive && isActive) {
          feedback.emitToast({
            title: "Scout's Eye awakened",
            subtitle: `+${SCOUTS_EYE_REVEAL_BONUS_METERS} m live sight until local midnight`,
            rarity: "uncommon",
            glyph: "◉",
          });
        }
        if (!previousStatus.trailSurgeActive && nextStatus.trailSurgeActive) {
          feedback.emitToast({ title: "Trail Surge awakened", subtitle: "+10% encounter XP until local midnight", rarity: "uncommon", glyph: "⚡" });
        }
        return;
      }
      setGameState(next);
    },
    [persist]
  );

  const reset = useCallback(() => {
    const fresh = resetGameState();
    gameStateRef.current = fresh;
    setGameState(fresh);
    setLastEncounter(null);
    setSaveWarning(null);
  }, []);

  const markFootfallSeen = useCallback(
    (cellKey: string) => {
      if (!gameState) return;
      const next = markFootfallSeenInState(gameState, cellKey);
      if (next === gameState) return;
      persist(next);
    },
    [gameState, persist]
  );

  const craftAtSanctum = useCallback(
    (recipeId: string) => {
      if (!gameState) return false;

      const result = tryCraftSanctumRecipe(gameState, recipeId);
      if (!result.ok) {
        feedback.emitToast({
          title: "Cannot craft",
          subtitle: result.message ?? "Missing materials.",
          rarity: "common",
          glyph: "⚗",
        });
        return false;
      }

      persist(result.state);
      feedback.emitToast({
        title: result.message ?? "Crafted",
        subtitle: "Drink it for Clear Sight",
        rarity: "uncommon",
        glyph: "⚗",
      });
      return true;
    },
    [gameState, persist]
  );

  const drinkHealingPotion = useCallback(() => {
    if (!gameState) return false;

    const result = tryDrinkHealingDraught(gameState);
    if (!result.ok) {
      feedback.emitToast({
        title: "Cannot drink",
        subtitle: result.message ?? "No potion in bag.",
        rarity: "common",
        glyph: "⚗",
      });
      return false;
    }

    persist(result.state);
    feedback.emitToast({
      title: "Clear Sight",
      subtitle: result.message ?? `+${SCOUTS_EYE_REVEAL_BONUS_METERS} m live sight`,
      rarity: "uncommon",
      glyph: "◉",
    });
    return true;
  }, [gameState, persist]);

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
    markFootfallSeen,
    craftAtSanctum,
    drinkHealingPotion,
    resetFieldReport,
    clearEncounter,
    clearSaveWarning,
    reset,
    samplePlayerMovement,
    getPoiVisitStatus: (poi: POI) =>
      gameState
        ? getPoiVisitUiStatus(
            gameState.visitedPois[poi.id],
            poi.type
          )
        : "fresh",
    isVisited: (poiId: string) => Boolean(gameState?.visitedPois[poiId]),
  };
}
