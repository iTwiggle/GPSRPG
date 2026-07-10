"use client";

export type MobilePanelSection =
  | "poi"
  | "tasks"
  | "bag"
  | "codex"
  | "camp"
  | "journey"
  | "dev";

const SECTIONS: { id: MobilePanelSection; label: string }[] = [
  { id: "poi", label: "Sites" },
  { id: "tasks", label: "Tasks" },
  { id: "bag", label: "Bag" },
  { id: "codex", label: "Album" },
  { id: "camp", label: "Camp" },
  { id: "journey", label: "Journey" },
  { id: "dev", label: "Dev" },
];

interface MobilePanelNavProps {
  activeSection: MobilePanelSection;
  devToolsEnabled: boolean;
  inventoryCount?: number;
  codexUniqueItems?: number;
  readyDepotDoors?: number;
  onSectionChange: (section: MobilePanelSection) => void;
}

function sectionBadge(
  id: MobilePanelSection,
  inventoryCount: number,
  codexUniqueItems: number,
  readyDepotDoors: number
): number | null {
  if (id === "bag" && inventoryCount > 0) return inventoryCount;
  if (id === "codex" && codexUniqueItems > 0) return codexUniqueItems;
  if (id === "camp" && readyDepotDoors > 0) return readyDepotDoors;
  return null;
}

export default function MobilePanelNav({
  activeSection,
  devToolsEnabled,
  inventoryCount = 0,
  codexUniqueItems = 0,
  readyDepotDoors = 0,
  onSectionChange,
}: MobilePanelNavProps) {
  const visibleSections = devToolsEnabled
    ? SECTIONS
    : SECTIONS.filter((section) => section.id !== "dev");

  return (
    <nav
      className="rpg-panel sticky top-0 z-10 -mx-1 px-2 py-2 lg:hidden"
      aria-label="Panel sections"
    >
      <div className="flex flex-wrap gap-1.5">
        {visibleSections.map(({ id, label }) => {
          const isActive = activeSection === id;
          const badge = sectionBadge(id, inventoryCount, codexUniqueItems, readyDepotDoors);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSectionChange(id)}
              aria-current={isActive ? "true" : undefined}
              className={`relative min-h-11 rounded-full px-3.5 py-2 text-xs font-semibold tracking-wide transition ${
                isActive
                  ? "bg-violet-600 text-white shadow-[0_0_14px_rgba(124,58,237,0.45)]"
                  : "border border-slate-600/60 bg-slate-800/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
              }`}
            >
              {label}
              {badge !== null && (
                <span
                  className={`ml-1.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-violet-500/20 text-violet-200"
                  }`}
                  aria-label={`${badge} items`}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
