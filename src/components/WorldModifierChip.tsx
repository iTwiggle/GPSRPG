"use client";

import type { WorldModifier } from "@/lib/temporal/world-modifier";

interface WorldModifierChipProps {
  modifier: WorldModifier;
  onPress: () => void;
}

export default function WorldModifierChip({
  modifier,
  onPress,
}: WorldModifierChipProps) {
  return (
    <button
      type="button"
      className="rpg-world-modifier-chip"
      onClick={onPress}
      aria-label={`Today's sign: ${modifier.name}. ${modifier.blurb} Open daily briefing.`}
    >
      <span className="rpg-world-modifier-chip__glyph" aria-hidden="true">
        ✦
      </span>
      <span className="rpg-world-modifier-chip__text">{modifier.name}</span>
    </button>
  );
}
