import { getSetProgressList } from "@/lib/item-catalog";
import {
  metersToLeagues,
  normalizeMovementLedger,
} from "@/lib/movement/movement-ledger";
import type { GameState } from "@/lib/types";
import { resolveCatalogId } from "./catalog-registry";
import type {
  CompanionOutdoorEffort,
  CompanionUnlockToken,
} from "./export-schema";

const EXPLORE_MILESTONES = [5, 10, 25, 50, 100];

export function buildUnlockTokens(state: GameState): CompanionUnlockToken[] {
  const tokens: CompanionUnlockToken[] = [];

  if (state.player.level > 1) {
    tokens.push({
      token: `level_reached:${state.player.level}`,
      at: state.companionMeta?.lastContractRefreshDate
        ? `${state.companionMeta.lastContractRefreshDate}T12:00:00.000Z`
        : new Date().toISOString(),
    });
  }

  for (const setId of state.codex.completedSetIds) {
    tokens.push({
      token: `set_complete:${setId}`,
      at: new Date().toISOString(),
    });
  }

  for (const milestone of EXPLORE_MILESTONES) {
    if (state.codex.stats.totalExplores >= milestone) {
      tokens.push({
        token: `explores_milestone:${milestone}`,
        at: new Date().toISOString(),
      });
    }
  }

  for (const doorId of state.baseCamp.claimedDoorIds) {
    tokens.push({
      token: `depot_door:${doorId}`,
      at: new Date().toISOString(),
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
  return state.player.inventory
    .map((item) => {
      const catalogId = resolveCatalogId(item);
      if (!catalogId) return null;
      const codexEntry = state.codex.items[catalogId];
      return {
        catalogId,
        rarity: item.rarity,
        acquiredAt: codexEntry?.firstFoundAt ?? codexEntry?.lastFoundAt ?? new Date().toISOString(),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

export function buildOutdoorEffortFromLedger(
  ledger: GameState["movementLedger"]
): CompanionOutdoorEffort {
  const normalized = normalizeMovementLedger(ledger);
  return {
    totalLeaguesCharted: metersToLeagues(normalized.totalMeters),
    todayLeaguesCharted: metersToLeagues(normalized.todayMeters),
    totalMinutesInMotion: Math.round(normalized.totalMinutesInMotion),
    outingsCompleted: normalized.outingsCompleted,
    lastOutdoorSessionAt: normalized.lastOutdoorSessionAt,
  };
}

export function createEmptyOutdoorEffort(): CompanionOutdoorEffort {
  return buildOutdoorEffortFromLedger(normalizeMovementLedger(undefined));
}
