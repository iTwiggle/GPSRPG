"use client";

import { useEffect, useRef, useState } from "react";
import { EASING } from "@/lib/feedback/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AnimatedNumberProps {
  value: number;
  /** Tween duration in ms. */
  durationMs?: number;
  className?: string;
  /** Adds a brief pop when the value increases. */
  popOnIncrease?: boolean;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Counts smoothly between values instead of snapping. A ticking inventory/XP
 * total reads as "alive". Snaps instantly under reduced motion.
 */
export default function AnimatedNumber({
  value,
  durationMs = 600,
  className = "",
  popOnIncrease = true,
}: AnimatedNumberProps) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const [popping, setPopping] = useState(false);
  const displayRef = useRef(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const previous = prevValueRef.current;
    prevValueRef.current = value;
    if (previous === value) return;

    if (reducedMotion) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }

    let popTimer: number | undefined;
    if (popOnIncrease && value > previous) {
      setPopping(true);
      popTimer = window.setTimeout(() => setPopping(false), 260);
    }

    const from = displayRef.current;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const current = Math.round(from + (value - from) * easeOutCubic(t));
      displayRef.current = current;
      setDisplay(current);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      if (popTimer) window.clearTimeout(popTimer);
    };
  }, [value, reducedMotion, durationMs, popOnIncrease]);

  return (
    <span
      className={`inline-block tabular-nums ${className}`}
      style={
        popping && !reducedMotion
          ? { animation: `an-pop 0.26s ${EASING.pop}` }
          : undefined
      }
    >
      {display.toLocaleString()}
    </span>
  );
}
