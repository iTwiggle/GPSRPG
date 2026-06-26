import type { Player } from "./types";

/** XP required to reach a given level (level 1 = 0 XP). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * (level - 1) * 50;
}

/** Compute level from total XP. */
export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) {
    level += 1;
  }
  return level;
}

/** XP needed for next level from current XP. */
export function xpToNextLevel(xp: number): number {
  const currentLevel = levelFromXp(xp);
  return xpForLevel(currentLevel + 1) - xp;
}

/** XP progress within the current level (0–1). */
export function xpProgress(xp: number): number {
  const level = levelFromXp(xp);
  const currentFloor = xpForLevel(level);
  const nextCeiling = xpForLevel(level + 1);
  const span = nextCeiling - currentFloor;
  if (span <= 0) return 1;
  return (xp - currentFloor) / span;
}

export function applyXp(player: Player, xpGained: number): Player {
  const newXp = player.xp + xpGained;
  return {
    ...player,
    xp: newXp,
    level: levelFromXp(newXp),
  };
}

export function createDefaultPlayer(): Player {
  return {
    name: "Wayfarer",
    level: 1,
    xp: 0,
    inventory: [],
  };
}
