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

  useEffect(() => {
    if (!playerPosition) return;

    setMemory((previous) => {
      const next = revealExplorationPosition(previous, playerPosition);
      if (next === previous) return previous;
      writeExplorationMemory(next);
      return next;
    });
  }, [playerPosition]);

  useEffect(() => {
    const handleReset = () => setMemory(createEmptyExplorationMemory());
    window.addEventListener(EXPLORATION_RESET_EVENT, handleReset);
    return () => window.removeEventListener(EXPLORATION_RESET_EVENT, handleReset);
  }, []);

  return memory;
}
