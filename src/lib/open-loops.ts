import { countReadyDepotDoors } from "@/lib/base-camp";
import { getAlmostCompleteSets } from "@/lib/item-catalog";
import { findNearestPoi } from "@/lib/approach";
import { canReExplorePoi } from "@/lib/temporal/poi-cooldowns";
import type { Codex, GameState, POI, Position } from "@/lib/types";

export interface OpenLoopNudge {
  id: string;
  message: string;
  tone: "amber" | "violet" | "emerald";
}

export function getTopOpenLoopNudge(input: {
  codex: Codex;
  baseCamp: GameState["baseCamp"];
  pois: POI[];
  playerPosition: Position | null;
  visitedPois: GameState["visitedPois"];
}): OpenLoopNudge | null {
  const almost = getAlmostCompleteSets(input.codex);
  if (almost.length > 0) {
    const set = almost[0]!.set;
    return {
      id: `set-${set.id}`,
      message: `One find from completing ${set.name}`,
      tone: "amber",
    };
  }

  const readyDoors = countReadyDepotDoors(input.codex, input.baseCamp);
  if (readyDoors > 0) {
    return {
      id: "depot-door",
      message: `${readyDoors} depot door${readyDoors === 1 ? "" : "s"} ready at camp`,
      tone: "violet",
    };
  }

  if (input.playerPosition) {
    const unexplored = input.pois.filter(
      (poi) =>
        canReExplorePoi(
          input.visitedPois[poi.id],
          poi.type
        )
    );
    const nearest = findNearestPoi(input.playerPosition, unexplored);
    if (nearest) {
      return {
        id: `poi-${nearest.id}`,
        message: `Nearest site: ${nearest.name}`,
        tone: "emerald",
      };
    }
  }

  return null;
}
