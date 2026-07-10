"use client";

import { XP_FLOAT } from "@/lib/feedback/config";
import type { XpSource } from "@/lib/feedback/types";

interface FloatingXpProps {
  amount: number;
  source: XpSource;
  jitterX: number;
  reducedMotion: boolean;
}

/** A single rising "+N XP" number. Positioned by the overlay stack. */
export default function FloatingXp({
  amount,
  source,
  jitterX,
  reducedMotion,
}: FloatingXpProps) {
  const color = XP_FLOAT.colorBySource[source];

  return (
    <span
      className={
        reducedMotion ? "rpg-xp-float rpg-xp-float--reduced" : "rpg-xp-float"
      }
      style={
        {
          "--xp-x": `${jitterX}px`,
          "--xp-rise": `${XP_FLOAT.risePx}px`,
          "--xp-ms": `${XP_FLOAT.durationMs}ms`,
          color,
          textShadow: `0 0 12px ${color}`,
        } as React.CSSProperties
      }
    >
      +{amount} XP
    </span>
  );
}
