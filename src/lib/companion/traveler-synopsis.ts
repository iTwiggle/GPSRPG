import { getActivePerkDetails } from "@/lib/base-camp";
import { getAlmostCompleteSets } from "@/lib/item-catalog";
import { metersToLeagues } from "@/lib/movement/movement-ledger";
import { xpToNextLevel } from "@/lib/xp";
import {
  buildSanctumScaffold,
  type CraftingProximityNudge,
  type SanctumGearSlot,
  type SanctumScaffold,
} from "./sanctum-scaffold";
import type { GameState } from "@/lib/types";

export interface TravelerFieldStats {
  level: number;
  xp: number;
  xpToNext: number;
  inventoryCount: number;
  codexFinds: number;
  sitesExplored: number;
  leaguesToday: number;
  outingsCompleted: number;
}

export interface TravelerAlbumNudge {
  setName: string;
  discovered: number;
  total: number;
}

export interface TravelerActivePerk {
  perkName: string;
  chargesRemaining: number;
}

export interface TravelerSynopsis {
  playerName: string;
  fieldStats: TravelerFieldStats;
  albumNudge: TravelerAlbumNudge | null;
  activePerks: TravelerActivePerk[];
  sanctum: SanctumScaffold;
}

export function buildTravelerSynopsis(state: GameState): TravelerSynopsis {
  const almost = getAlmostCompleteSets(state.codex);
  const album = almost[0];

  return {
    playerName: state.player.name,
    fieldStats: {
      level: state.player.level,
      xp: state.player.xp,
      xpToNext: xpToNextLevel(state.player.xp),
      inventoryCount: state.player.inventory.length,
      codexFinds: Object.keys(state.codex.items).length,
      sitesExplored: state.codex.stats.totalExplores,
      leaguesToday: metersToLeagues(state.movementLedger.todayMeters),
      outingsCompleted: state.movementLedger.outingsCompleted,
    },
    albumNudge: album
      ? {
          setName: album.set.name,
          discovered: album.discovered,
          total: album.total,
        }
      : null,
    activePerks: getActivePerkDetails(state.baseCamp).map((perk) => ({
      perkName: perk.perkName,
      chargesRemaining: perk.chargesRemaining,
    })),
    sanctum: buildSanctumScaffold(state),
  };
}

export type { CraftingProximityNudge, SanctumGearSlot, SanctumScaffold };
