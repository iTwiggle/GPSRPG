import type { POIType } from "./types";

export const POI_TYPE_ACCENT: Record<POIType, string> = {
  shrine: "text-violet-300",
  camp: "text-orange-300",
  tower: "text-slate-200",
  gate: "text-amber-300",
  grove: "text-emerald-300",
  cache: "text-yellow-300",
  quarry: "text-stone-300",
  well: "text-sky-300",
};

export const POI_TYPE_CHIP_BG: Record<POIType, string> = {
  shrine: "bg-violet-500/20 border-violet-400/40 text-violet-200",
  camp: "bg-orange-500/20 border-orange-400/40 text-orange-200",
  tower: "bg-slate-500/20 border-slate-300/40 text-slate-200",
  gate: "bg-amber-500/20 border-amber-400/40 text-amber-200",
  grove: "bg-emerald-500/20 border-emerald-400/40 text-emerald-200",
  cache: "bg-yellow-500/20 border-yellow-400/40 text-yellow-200",
  quarry: "bg-stone-500/20 border-stone-400/40 text-stone-200",
  well: "bg-sky-500/20 border-sky-400/40 text-sky-200",
};

/** CSS classes for inline/card POI glyphs (reuses map marker styles). */
export function getPoiGlyphClassName(type: POIType): string {
  return `poi-card-glyph poi-marker poi-marker--${type}`;
}
