"use client";

import { useCallback, useEffect, useState } from "react";
import { appendExploreEvents } from "@/lib/activity-log";
import { recordExplore } from "@/lib/codex";
import { applyXp } from "@/lib/xp";
import {
  addLootToPlayer,
  loadGameState,
  markPoiVisited,
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
      const nextState = markPoiVisited(
        {
          ...gameState,
          player: withLoot,
          codex: withCodex,
          activityLog: withActivity,
        },
        poi.id
      );

      persist(nextState);
      setLastEncounter(encounter);
      return encounter;
    },
    [gameState, persist]
  );

  const clearEncounter = useCallback(() => {
    setLastEncounter(null);
  }, []);

  const reset = useCallback(() => {
    const fresh = resetGameState();
    setGameState(fresh);
    setLastEncounter(null);
  }, []);

  return {
    gameState,
    lastEncounter,
    explorePoi,
    clearEncounter,
    reset,
    isVisited: (poiId: string) =>
      gameState?.visitedPOIIds.includes(poiId) ?? false,
  };
}
