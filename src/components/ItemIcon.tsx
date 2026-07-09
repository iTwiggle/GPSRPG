import {
  ITEM_TYPE_GLYPH,
  RARITY_GLOW_CLASS,
} from "@/lib/item-visual";
import type { Item, ItemRarity } from "@/lib/types";

interface ItemIconProps {
  type: Item["type"];
  rarity?: ItemRarity;
  size?: "sm" | "md";
  className?: string;
}

export default function ItemIcon({
  type,
  rarity = "common",
  size = "sm",
  className = "",
}: ItemIconProps) {
  const sizeClass = size === "md" ? "h-10 w-10 text-lg" : "h-8 w-8 text-sm";

  return (
    <span
      className={`rpg-item-icon inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-600/50 bg-slate-950/70 ${sizeClass} ${RARITY_GLOW_CLASS[rarity]} ${className}`}
      aria-hidden="true"
    >
      {ITEM_TYPE_GLYPH[type]}
    </span>
  );
}
