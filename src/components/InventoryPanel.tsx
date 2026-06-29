import type { Item } from "@/lib/types";

interface InventoryPanelProps {
  inventory: Item[];
}

const RARITY_COLORS: Record<Item["rarity"], string> = {
  common: "text-slate-300",
  uncommon: "text-emerald-300",
  rare: "text-amber-300",
};

export default function InventoryPanel({ inventory }: InventoryPanelProps) {
  return (
    <div className="rpg-panel p-4">
      <h2 className="text-sm font-semibold text-slate-100">Inventory</h2>
      {inventory.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No loot yet. Explore a site!</p>
      ) : (
        <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
          {inventory.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-sm"
            >
              <span className="font-medium text-slate-200">{item.name}</span>
              <span className={`capitalize ${RARITY_COLORS[item.rarity]}`}>
                {item.rarity} {item.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
