"use client";

export type MobilePanelSection = "poi" | "bag" | "codex" | "journey" | "dev";

const SECTIONS: { id: MobilePanelSection; label: string }[] = [
  { id: "poi", label: "Sites" },
  { id: "bag", label: "Bag" },
  { id: "codex", label: "Codex" },
  { id: "journey", label: "Journey" },
  { id: "dev", label: "Dev" },
];

interface MobilePanelNavProps {
  activeSection: MobilePanelSection;
  onSectionChange: (section: MobilePanelSection) => void;
}

export default function MobilePanelNav({
  activeSection,
  onSectionChange,
}: MobilePanelNavProps) {
  return (
    <nav
      className="rpg-panel sticky top-0 z-10 -mx-1 px-2 py-2 lg:hidden"
      aria-label="Panel sections"
    >
      <div className="flex flex-wrap gap-1.5">
        {SECTIONS.map(({ id, label }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSectionChange(id)}
              aria-current={isActive ? "true" : undefined}
              className={`min-h-11 rounded-full px-3.5 py-2 text-xs font-semibold tracking-wide transition ${
                isActive
                  ? "bg-violet-600 text-white shadow-[0_0_14px_rgba(124,58,237,0.45)]"
                  : "border border-slate-600/60 bg-slate-800/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
