"use client";

import { useEffect } from "react";
import { installDomOverlay } from "@/lib/feedback/dom-overlay";

/**
 * Installs the DOM overlay sink once on mount. Rendering itself is handled
 * imperatively by the overlay (see dom-overlay.ts) for maximum robustness across
 * Next's server/client boundaries; this component is just the lifecycle hook.
 */
export default function FeedbackProvider() {
  useEffect(() => installDomOverlay(), []);
  return null;
}
