import { getSetProgressList } from "@/lib/item-catalog";
import type { GameState } from "@/lib/types";
import { resolveCatalogId } from "./catalog-registry";
import type { CompanionUnlockToken } from "./export-schema";

export function buildUnlockTokens(state: GameState): CompanionUnlockToken[] {
  const tokens: CompanionUnlockToken[] = [];
  const now = new Date().toISOString();

  if (state.player.level > 1) {
    tokens.push({
      token: `level_reached:${state.player.level}`,
      at: now,
    });
  }

  for (const setId of state.codex.completedSetIds) {
    tokens.push({
      token: `set_complete:${setId}`,
      at: now,
    });
  }

  if (state.codex.stats.totalExplores > 0) {
    tokens.push({
      token: `explores:${state.codex.stats.totalExplores}`,
      at: now,
    });
  }

  for (const doorId of state.baseCamp.claimedDoorIds) {
    tokens.push({
      token: `depot_door:${doorId}`,
      at: now,
    });
  }

  return tokens;
}

export function buildBoards(state: GameState) {
  return {
    completedSetIds: [...state.codex.completedSetIds],
    setProgress: getSetProgressList(state.codex).map((progress) => ({
      setId: progress.set.id,
      discovered: progress.discovered,
      total: progress.total,
      complete: progress.complete,
    })),
    codexStats: { ...state.codex.stats },
  };
}

export function buildInventoryExport(state: GameState) {
  const timestamp = new Date().toISOString();

  return state.player.inventory
    .map((item) => {
      const catalogId = resolveCatalogId(item);
      if (!catalogId) return null;
      return {
        catalogId,
        rarity: item.rarity,
        acquiredAt: timestamp,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

export function createEmptyOutdoorEffort() {
  return {
    totalLeaguesCharted: 0,
    todayLeaguesCharted: 0,
    totalMinutesInMotion: 0,
    outingsCompleted: 0,
    lastOutdoorSessionAt: null,
  };
}
