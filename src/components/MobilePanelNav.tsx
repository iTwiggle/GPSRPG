"use client";

export type MobilePanelSection = "poi" | "bag" | "codex" | "journey" | "dev";

const SECTIONS: { id: MobilePanelSection; label: string }[] = [
  { id: "poi", label: "POI" },
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
      className="sticky top-0 z-10 -mx-1 rounded-xl border border-slate-200 bg-white/95 px-2 py-2 shadow-sm backdrop-blur lg:hidden"
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
              className={`min-h-11 rounded-full px-3.5 py-2 text-xs font-medium transition ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
