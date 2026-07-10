"use client";

import { useMemo } from "react";
import { PARTICLES } from "@/lib/feedback/config";

interface ParticleBurstProps {
  count: number;
  color: string;
  /** Deterministic-ish seed so re-renders don't reshuffle a live burst. */
  seed: number;
}

/**
 * Lightweight DOM particle burst — no canvas, no deps. Each particle is a span
 * animated outward via CSS custom properties, so the GPU handles it and counts
 * stay capped. Callers gate this behind reduced motion (it renders nothing when
 * reduced).
 */
export default function ParticleBurst({ count, color, seed }: ParticleBurstProps) {
  const particles = useMemo(() => {
    const total = Math.min(count, PARTICLES.hardCap);
    return Array.from({ length: total }, (_, i) => {
      // Cheap deterministic pseudo-random from seed+index.
      const rand = (n: number) => {
        const x = Math.sin(seed * 999 + i * 37 + n * 13) * 10000;
        return x - Math.floor(x);
      };
      const angle = (i / total) * Math.PI * 2 + rand(1) * 0.6;
      const travel =
        PARTICLES.minTravelPx +
        rand(2) * (PARTICLES.maxTravelPx - PARTICLES.minTravelPx);
      const size = 4 + rand(3) * 5;
      return {
        id: i,
        dx: Math.cos(angle) * travel,
        dy: Math.sin(angle) * travel,
        size,
        delay: rand(4) * 60,
      };
    });
  }, [count, seed]);

  return (
    <div className="rpg-particle-burst" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="rpg-particle"
          style={
            {
              "--px": `${p.dx}px`,
              "--py": `${p.dy}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: color,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${PARTICLES.durationMs}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
