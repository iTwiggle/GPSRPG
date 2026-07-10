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
 * Counts smoothly between values instead of snapping. Small touch, but a ticking
 * inventory/XP total reads as "alive". Respects reduced motion by snapping.
 */
export default function AnimatedNumber({
  value,
  durationMs = 520,
  className = "",
  popOnIncrease = true,
}: AnimatedNumberProps) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const [popping, setPopping] = useState(false);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const previous = prevValueRef.current;
    prevValueRef.current = value;

    if (reducedMotion || previous === value) {
      setDisplay(value);
      return;
    }

    if (popOnIncrease && value > previous) {
      setPopping(true);
      const popTimer = window.setTimeout(() => setPopping(false), 260);
      // fall through to tween; cleanup handles both
      fromRef.current = display;
      const start = performance.now();
      const animate = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = easeOutCubic(t);
        setDisplay(Math.round(fromRef.current + (value - fromRef.current) * eased));
        if (t < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };
      frameRef.current = requestAnimationFrame(animate);
      return () => {
        window.clearTimeout(popTimer);
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
      };
    }

    fromRef.current = display;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOutCubic(t);
      setDisplay(Math.round(fromRef.current + (value - fromRef.current) * eased));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // display intentionally excluded: we snapshot it as the tween origin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
