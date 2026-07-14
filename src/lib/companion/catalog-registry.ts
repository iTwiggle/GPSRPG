import type { Item } from "@/lib/types";

/**
 * Stable catalog slugs shared with UE5 DataTables.
 * Never rename slugs after release — display names may change freely.
 */
export const CATALOG_IDS = {
  rustyDagger: "rusty-dagger",
  travelersCloak: "travelers-cloak",
  healingDraught: "healing-draught",
  silverCoinPouch: "silver-coin-pouch",
  enchantedShortbow: "enchanted-shortbow",
  chainVest: "chain-vest",
  phoenixFeather: "phoenix-feather",
  dragonScale: "dragon-scale",
  offeringBowl: "offering-bowl",
  spiritCharm: "spirit-charm",
  scoutsKnife: "scouts-knife",
  banditSatchel: "bandit-satchel",
  signalFlare: "signal-flare",
  lookoutLens: "lookout-lens",
  rustyGateKey: "rusty-gate-key",
  patrolBadge: "patrol-badge",
  herbBundle: "herb-bundle",
  beastFang: "beast-fang",
  smugglersPouch: "smugglers-pouch",
  roadRunnerBlade: "road-runner-blade",
  stoneChisel: "stone-chisel",
  minersToken: "miners-token",
  wellCoin: "well-coin",
  drownedLocket: "drowned-locket",
} as const;

export type CatalogId = (typeof CATALOG_IDS)[keyof typeof CATALOG_IDS];

const LEGACY_KEY_TO_CATALOG_ID = new Map<string, CatalogId>([
  ["Rusty Dagger|weapon", CATALOG_IDS.rustyDagger],
  ["Traveler's Cloak|armor", CATALOG_IDS.travelersCloak],
  ["Healing Draught|consumable", CATALOG_IDS.healingDraught],
  ["Silver Coin Pouch|treasure", CATALOG_IDS.silverCoinPouch],
  ["Enchanted Shortbow|weapon", CATALOG_IDS.enchantedShortbow],
  ["Chain Vest|armor", CATALOG_IDS.chainVest],
  ["Phoenix Feather|consumable", CATALOG_IDS.phoenixFeather],
  ["Dragon Scale|treasure", CATALOG_IDS.dragonScale],
  ["Offering Bowl|treasure", CATALOG_IDS.offeringBowl],
  ["Spirit Charm|consumable", CATALOG_IDS.spiritCharm],
  ["Scout's Knife|weapon", CATALOG_IDS.scoutsKnife],
  ["Bandit Satchel|treasure", CATALOG_IDS.banditSatchel],
  ["Signal Flare|consumable", CATALOG_IDS.signalFlare],
  ["Lookout Lens|treasure", CATALOG_IDS.lookoutLens],
  ["Rusty Gate Key|treasure", CATALOG_IDS.rustyGateKey],
  ["Patrol Badge|armor", CATALOG_IDS.patrolBadge],
  ["Herb Bundle|consumable", CATALOG_IDS.herbBundle],
  ["Beast Fang|weapon", CATALOG_IDS.beastFang],
  ["Smuggler's Pouch|treasure", CATALOG_IDS.smugglersPouch],
  ["Road Runner Blade|weapon", CATALOG_IDS.roadRunnerBlade],
  ["Stone Chisel|weapon", CATALOG_IDS.stoneChisel],
  ["Miner's Token|treasure", CATALOG_IDS.minersToken],
  ["Well Coin|treasure", CATALOG_IDS.wellCoin],
  ["Drowned Locket|treasure", CATALOG_IDS.drownedLocket],
]);

const CATALOG_ID_TO_LEGACY_KEY = new Map<CatalogId, string>(
  [...LEGACY_KEY_TO_CATALOG_ID.entries()].map(([legacy, catalogId]) => [
    catalogId,
    legacy,
  ])
);

export function legacyItemKey(name: string, type: Item["type"]): string {
  return `${name}|${type}`;
}

export function resolveCatalogId(
  item: Pick<Item, "name" | "type" | "catalogId">
): CatalogId | null {
  if (item.catalogId) {
    return item.catalogId as CatalogId;
  }
  return (
    LEGACY_KEY_TO_CATALOG_ID.get(legacyItemKey(item.name, item.type)) ?? null
  );
}

export function itemCatalogKey(
  item: Pick<Item, "name" | "type" | "catalogId">
): string {
  return resolveCatalogId(item) ?? legacyItemKey(item.name, item.type);
}

export function migrateLegacyCodexKey(key: string): string {
  return LEGACY_KEY_TO_CATALOG_ID.get(key) ?? key;
}

export function isCatalogId(value: string): value is CatalogId {
  return CATALOG_ID_TO_LEGACY_KEY.has(value as CatalogId);
}
