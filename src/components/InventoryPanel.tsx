import AnimatedNumber from "@/components/AnimatedNumber";
import ItemIcon from "@/components/ItemIcon";
import {
  SALVAGE_COMMON_COUNT,
  SALVAGE_XP_REWARD,
  canSalvageCommon,
} from "@/lib/duplicate-salvage";
import { HEALING_DRAUGHT_CATALOG_ID } from "@/lib/companion/clear-sight";
import {
  aggregateInventory,
  ITEM_TYPE_LABEL,
  RARITY_CHIP,
  RARITY_LABEL,
  RARITY_TEXT,
} from "@/lib/item-visual";
import type { Item } from "@/lib/types";

interface InventoryPanelProps {
  inventory: Item[];
  onSalvageCommon?: (catalogKey: string) => boolean;
  onDrinkHealingPotion?: () => boolean;
}

export default function InventoryPanel({
  inventory,
  onSalvageCommon,
  onDrinkHealingPotion,
}: InventoryPanelProps) {
  const items = aggregateInventory(inventory);
  const totalPieces = inventory.length;

  return (
    <div className="rpg-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Inventory</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {totalPieces === 0
              ? "Loot from explored sites appears here."
              : `${totalPieces} piece${totalPieces === 1 ? "" : "s"} · ${items.length} unique`}
          </p>
        </div>
        {totalPieces > 0 && (
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-200">
            <AnimatedNumber value={totalPieces} />
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No loot yet. Explore a site within range to roll encounters and items.
        </p>
      ) : (
        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
          {items.map((item) => {
            const salvageable =
              onSalvageCommon &&
              canSalvageCommon(
                { name: item.name, type: item.type, rarity: item.rarity },
                item.count
              );

            return (
              <li
                key={item.key}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${RARITY_CHIP[item.rarity]}`}
              >
                <ItemIcon type={item.type} rarity={item.rarity} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {item.name}
                    {item.count > 1 && (
                      <span className="ml-1 text-xs opacity-75">×{item.count}</span>
                    )}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide opacity-75">
                    {ITEM_TYPE_LABEL[item.type]}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {item.key === HEALING_DRAUGHT_CATALOG_ID &&
                    onDrinkHealingPotion && (
                      <button
                        type="button"
                        onClick={() => onDrinkHealingPotion()}
                        className="rounded border border-emerald-500/45 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-100 hover:bg-emerald-500/25"
                        title="Drink for +80 m Clear Sight (45 min)"
                      >
                        Drink
                      </button>
                    )}
                  {salvageable && (
                    <button
                      type="button"
                      onClick={() => onSalvageCommon(item.key)}
                      className="rounded border border-slate-500/50 bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200 hover:bg-slate-700/80"
                      title={`Trade ${SALVAGE_COMMON_COUNT} copies for ${SALVAGE_XP_REWARD} XP`}
                    >
                      Salvage
                    </button>
                  )}
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${RARITY_TEXT[item.rarity]}`}
                  >
                    {RARITY_LABEL[item.rarity]}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
