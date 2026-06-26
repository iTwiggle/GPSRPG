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
    <div className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Adventurer
          </p>
          <h1 className="text-lg font-bold text-slate-900">{player.name}</h1>
          <p className="text-sm text-slate-600">
            Level {player.level} · {player.xp} XP
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
          {gpsLabel}
        </span>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Progress to next level</span>
          <span>{toNext} XP to go</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
