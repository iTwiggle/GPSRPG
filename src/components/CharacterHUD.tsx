"use client";

import { xpProgress, xpToNextLevel } from "@/lib/xp";
import type { Player } from "@/lib/types";

interface CharacterHUDProps {
  player: Player;
  gpsLabel: string;
}

export default function CharacterHUD({ player, gpsLabel }: CharacterHUDProps) {
  const progress = xpProgress(player.xp);
  const toNext = xpToNextLevel(player.xp);

  return (
    <div className="rpg-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">
            Adventurer
          </p>
          <h1 className="text-lg font-bold text-slate-50">{player.name}</h1>
          <p className="text-sm text-slate-400">
            <span className="font-semibold text-amber-300">Level {player.level}</span>
            {" · "}
            {player.xp} XP
          </p>
        </div>
        <span className="rounded-full border border-violet-500/35 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-200">
          {gpsLabel}
        </span>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Quest progress</span>
          <span>{toNext} XP to next level</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full border border-slate-700/60 bg-slate-900">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 via-amber-500 to-violet-500 transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
