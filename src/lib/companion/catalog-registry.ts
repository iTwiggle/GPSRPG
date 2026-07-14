import type { Item } from "@/lib/types";
import { ITEM_CATALOG } from "@/lib/item-catalog";

/**
 * Stable catalog slugs shared with UE5 DataTables.
 * Derived from ITEM_CATALOG — never duplicate slugs elsewhere.
 */
export type CatalogId = (typeof ITEM_CATALOG)[number]["catalogId"];

const KNOWN_CATALOG_IDS = new Set<string>(
  ITEM_CATALOG.map((entry) => entry.catalogId)
);

const LEGACY_KEY_TO_CATALOG_ID = new Map<string, CatalogId>(
  ITEM_CATALOG.map((entry) => [
    `${entry.name}|${entry.type}`,
    entry.catalogId,
  ])
);

export const CATALOG_IDS = Object.fromEntries(
  ITEM_CATALOG.map((entry) => [
    entry.catalogId
      .split("-")
      .map((part, index) =>
        index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join(""),
    entry.catalogId,
  ])
) as Record<string, CatalogId>;

export function legacyItemKey(name: string, type: Item["type"]): string {
  return `${name}|${type}`;
}

export function isCatalogId(value: string): value is CatalogId {
  return KNOWN_CATALOG_IDS.has(value);
}

export function resolveCatalogId(
  item: Pick<Item, "name" | "type" | "catalogId">
): CatalogId | null {
  if (item.catalogId) {
    return isCatalogId(item.catalogId) ? item.catalogId : null;
  }
  return LEGACY_KEY_TO_CATALOG_ID.get(legacyItemKey(item.name, item.type)) ?? null;
}

export function itemCatalogKey(
  item: Pick<Item, "name" | "type" | "catalogId">
): string {
  return resolveCatalogId(item) ?? legacyItemKey(item.name, item.type);
}

export function migrateLegacyCodexKey(key: string): string {
  return LEGACY_KEY_TO_CATALOG_ID.get(key) ?? key;
}
