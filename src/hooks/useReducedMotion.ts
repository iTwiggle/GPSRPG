"use client";

import { useEffect, useState } from "react";
import {
  onReducedMotionChange,
  prefersReducedMotion,
} from "@/lib/feedback/motion";

/** React binding for the reduced-motion preference, updated live. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    return onReducedMotionChange(setReduced);
  }, []);

  return reduced;
}
