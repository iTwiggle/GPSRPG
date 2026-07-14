"use client";

import AnimatedNumber from "@/components/AnimatedNumber";
import { formatGpsAccuracy } from "@/lib/distance";
import { xpProgress, xpToNextLevel } from "@/lib/xp";
import type { Player } from "@/lib/types";

interface CharacterHUDProps {
  player: Player;
  gpsLabel: string;
  gpsAccuracyMeters?: number | null;
  showGpsAccuracy?: boolean;
  leaguesToday?: number;
}

export default function CharacterHUD({
  player,
  gpsLabel,
  gpsAccuracyMeters = null,
  showGpsAccuracy = false,
  leaguesToday = 0,
}: CharacterHUDProps) {
  const progress = xpProgress(player.xp);
  const toNext = xpToNextLevel(player.xp);
  const accuracyLabel =
    showGpsAccuracy &&
    gpsAccuracyMeters !== null &&
    Number.isFinite(gpsAccuracyMeters)
      ? formatGpsAccuracy(gpsAccuracyMeters)
      : null;

  return (
    <section className="rpg-viewfinder-hud" aria-label="Player status">
      <div className="rpg-viewfinder-hud__identity">
        <span className="rpg-viewfinder-hud__brand">GPSRPG</span>
        <span className="rpg-viewfinder-hud__divider" aria-hidden="true" />
        <span className="truncate text-xs font-semibold text-slate-100">
          {player.name}
        </span>
      </div>
      <div className="rpg-viewfinder-hud__progress">
        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-xs font-bold text-amber-200">
            Lv <AnimatedNumber value={player.level} />
          </span>
          <span className="text-[10px] text-slate-300/75">
            <AnimatedNumber value={player.xp} /> XP
          </span>
        </div>
        <div
          className="rpg-viewfinder-hud__xp-track"
          role="progressbar"
          aria-label={`${toNext} XP to next level`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div
            className="rpg-viewfinder-hud__xp-fill"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
      <div className="rpg-viewfinder-hud__gps">
        <span className="rpg-viewfinder-hud__gps-dot" aria-hidden="true" />
        <span>{gpsLabel}</span>
        {leaguesToday > 0 && (
          <span className="text-[9px] text-emerald-300/90">
            · {leaguesToday} league{leaguesToday === 1 ? "" : "s"} today
          </span>
        )}
        {accuracyLabel && (
          <span
            className="text-[9px] text-slate-400/80"
            title="Estimated horizontal GPS accuracy from your device"
          >
            · {accuracyLabel}
          </span>
        )}
      </div>
    </section>
  );
}
