import type { Item } from "./types";

/** Stable identity for catalog / codex / salvage / set tracking. */
export function catalogItemKey(item: Pick<Item, "name" | "type">): string {
  return `${item.name}|${item.type}`;
}
