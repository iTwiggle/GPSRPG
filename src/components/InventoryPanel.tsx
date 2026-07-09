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
}

export default function InventoryPanel({ inventory }: InventoryPanelProps) {
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
            {totalPieces}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No loot yet. Explore a site within range to roll encounters and items.
        </p>
      ) : (
        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.key}
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${RARITY_CHIP[item.rarity]}`}
            >
              <div className="min-w-0">
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
              <span className={`shrink-0 text-xs font-semibold uppercase tracking-wide ${RARITY_TEXT[item.rarity]}`}>
                {RARITY_LABEL[item.rarity]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
