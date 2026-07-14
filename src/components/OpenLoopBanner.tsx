"use client";

import type { OpenLoopNudge } from "@/lib/open-loops";

interface OpenLoopBannerProps {
  nudge: OpenLoopNudge | null;
}

export default function OpenLoopBanner({ nudge }: OpenLoopBannerProps) {
  if (!nudge) return null;

  const toneClass =
    nudge.tone === "amber"
      ? "border-amber-500/35 bg-amber-500/10 text-amber-100"
      : nudge.tone === "emerald"
        ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-100"
        : "border-violet-500/35 bg-violet-500/10 text-violet-100";

  return (
    <div
      className={`rpg-open-loop ${toneClass}`}
      role="status"
      aria-live="polite"
    >
      <span className="rpg-open-loop__glyph" aria-hidden="true">
        ✦
      </span>
      <span className="rpg-open-loop__text">{nudge.message}</span>
    </div>
  );
}
