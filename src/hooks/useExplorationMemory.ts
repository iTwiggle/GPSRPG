"use client";

import { useEffect, useState } from "react";
import {
  createEmptyExplorationMemory,
  EXPLORATION_RESET_EVENT,
  readExplorationMemory,
  revealExplorationPosition,
  writeExplorationMemory,
  type ExplorationMemory,
} from "@/lib/exploration-memory";
import type { Position } from "@/lib/types";

export function useExplorationMemory(
  playerPosition: Position | null
): ExplorationMemory {
  const [memory, setMemory] = useState<ExplorationMemory>(
    readExplorationMemory
  );
  const playerLat = playerPosition?.lat;
  const playerLng = playerPosition?.lng;

  useEffect(() => {
    if (playerLat === undefined || playerLng === undefined) return;

    const position = { lat: playerLat, lng: playerLng };
    setMemory((previous) => {
      const next = revealExplorationPosition(previous, position);
      if (next === previous) return previous;
      writeExplorationMemory(next);
      return next;
    });
  }, [playerLat, playerLng]);

  useEffect(() => {
    const handleReset = () => setMemory(createEmptyExplorationMemory());
    window.addEventListener(EXPLORATION_RESET_EVENT, handleReset);
    return () => window.removeEventListener(EXPLORATION_RESET_EVENT, handleReset);
  }, []);

  return memory;
}
