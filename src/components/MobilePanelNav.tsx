"use client";

export type MobilePanelSection =
  | "poi"
  | "tasks"
  | "bag"
  | "codex"
  | "camp"
  | "journey"
  | "dev";

const SECTIONS: {
  id: MobilePanelSection;
  label: string;
  glyph: string;
}[] = [
  { id: "poi", label: "Sites", glyph: "⌖" },
  { id: "tasks", label: "Tasks", glyph: "◆" },
  { id: "bag", label: "Bag", glyph: "▣" },
  { id: "codex", label: "Codex", glyph: "✦" },
  { id: "camp", label: "Camp", glyph: "⌂" },
  { id: "journey", label: "Journey", glyph: "≡" },
  { id: "dev", label: "Dev", glyph: "⚙" },
];

interface MobilePanelNavProps {
  activeSection: MobilePanelSection | null;
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
      className="rpg-viewfinder-dock"
      aria-label="Game panels"
    >
      <div className="rpg-viewfinder-dock__rail">
        {visibleSections.map(({ id, label, glyph }) => {
          const isActive = activeSection === id;
          const badge = sectionBadge(id, inventoryCount, codexUniqueItems, readyDepotDoors);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSectionChange(id)}
              aria-current={isActive ? "true" : undefined}
              aria-expanded={isActive}
              aria-controls="viewfinder-panel"
              className={`rpg-viewfinder-dock__button ${
                isActive
                  ? "rpg-viewfinder-dock__button--active"
                  : ""
              }`}
            >
              <span className="rpg-viewfinder-dock__glyph" aria-hidden="true">
                {glyph}
              </span>
              <span className="rpg-viewfinder-dock__label">{label}</span>
              {badge !== null && (
                <span
                  className="rpg-viewfinder-dock__badge"
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
