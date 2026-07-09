import type { ActivityEvent, ActivityEventType, ItemRarity } from "@/lib/types";

interface ActivityLogPanelProps {
  events: ActivityEvent[];
}

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: "text-slate-300",
  uncommon: "text-emerald-300",
  rare: "text-amber-300",
};

const TYPE_ACCENTS: Record<ActivityEventType, string> = {
  poi_explored: "border-l-violet-400",
  encounter: "border-l-purple-400",
  xp_gained: "border-l-sky-400",
  item_found: "border-l-amber-400",
  level_up: "border-l-emerald-500",
  task_complete: "border-l-teal-400",
  field_report: "border-l-cyan-400",
  set_complete: "border-l-amber-500",
};

const TYPE_LABELS: Record<ActivityEventType, string> = {
  poi_explored: "POI",
  encounter: "Encounter",
  xp_gained: "XP",
  item_found: "Loot",
  level_up: "Level",
  task_complete: "Contract",
  field_report: "Report",
  set_complete: "Album",
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function messageClass(event: ActivityEvent): string {
  if (event.type === "item_found" && event.rarity) {
    return RARITY_COLORS[event.rarity];
  }
  if (event.type === "level_up") {
    return "font-medium text-emerald-300";
  }
  if (event.type === "task_complete") {
    return "font-medium text-teal-200";
  }
  if (event.type === "field_report") {
    return "text-cyan-200";
  }
  return "text-slate-200";
}

export default function ActivityLogPanel({ events }: ActivityLogPanelProps) {
  return (
    <div className="rpg-panel p-4">
      <h2 className="text-sm font-semibold text-slate-100">Activity Log</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Recent journey entries — newest first.
      </p>

      {events.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No journey entries yet.</p>
      ) : (
        <ul className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
          {events.map((event) => (
            <li
              key={event.id}
              className={`flex items-start justify-between gap-2 rounded-r-md border-l-2 border-slate-700/40 bg-slate-900/50 px-2.5 py-1.5 text-sm ${TYPE_ACCENTS[event.type]}`}
            >
              <div className="min-w-0">
                <p className={`truncate ${messageClass(event)}`}>
                  {event.message}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  {TYPE_LABELS[event.type]}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-500">
                {formatTime(event.timestamp)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
