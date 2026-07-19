"use client";

import {
  DEPOT_DOORS,
  getActivePerkDetails,
  getDepotDoorStatus,
  getSetNameForDoor,
  type DepotDoorStatus,
} from "@/lib/base-camp";
import type { BaseCampState, Codex, GameState } from "@/lib/types";
import CompanionExportPanel from "@/components/CompanionExportPanel";
import CitadelCraftPanel from "@/components/CitadelCraftPanel";

interface BaseCampPanelProps {
  codex: Codex;
  baseCamp: BaseCampState;
  fieldReportSites: number;
  gameState: GameState;
  onClaimDoor: (doorId: string) => boolean;
  onCraft?: (recipeId: string) => boolean;
  onMarkVisit?: () => void;
}

const DOOR_STATUS_LABEL: Record<DepotDoorStatus, string> = {
  locked: "Sealed",
  ready: "Ready",
  claimed: "Opened",
};

const DOOR_STATUS_CLASS: Record<DepotDoorStatus, string> = {
  locked: "border-slate-700/50 bg-slate-950/40 text-slate-500",
  ready: "border-amber-500/45 bg-amber-500/10 text-amber-50 rpg-depot-door--ready",
  claimed: "border-emerald-500/35 bg-emerald-500/10 text-emerald-50",
};

export default function BaseCampPanel({
  codex,
  baseCamp,
  fieldReportSites,
  gameState,
  onClaimDoor,
  onCraft,
  onMarkVisit,
}: BaseCampPanelProps) {
  const activePerks = getActivePerkDetails(baseCamp);
  const readyCount = DEPOT_DOORS.filter(
    (door) => getDepotDoorStatus(door, codex, baseCamp) === "ready"
  ).length;

  return (
    <div className="rpg-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Base Camp</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Return here after a field outing — album sets unlock depot doors and
            field perks for your next run.
          </p>
        </div>
        {readyCount > 0 && (
          <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-200">
            {readyCount} ready
          </span>
        )}
      </div>

      {fieldReportSites > 0 && (
        <p className="mt-3 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
          Current outing: {fieldReportSites} site
          {fieldReportSites === 1 ? "" : "s"} logged — claim any ready doors
          before heading back out.
        </p>
      )}

      <section className="mt-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Depot doors
        </h3>
        <ul className="mt-2 space-y-2">
          {DEPOT_DOORS.map((door) => {
            const status = getDepotDoorStatus(door, codex, baseCamp);
            const setName = getSetNameForDoor(door);

            return (
              <li
                key={door.id}
                className={`rounded-lg border px-3 py-2.5 text-sm ${DOOR_STATUS_CLASS[status]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{door.name}</p>
                    <p className="mt-0.5 text-xs opacity-80">{door.blurb}</p>
                    {status === "locked" && (
                      <p className="mt-1 text-[11px] opacity-70">
                        Requires album set: {setName}
                      </p>
                    )}
                    {status !== "locked" && (
                      <p className="mt-1 text-[11px] opacity-80">
                        Unlocks perk: {door.perkName} — {door.perkDescription}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide">
                    {DOOR_STATUS_LABEL[status]}
                  </span>
                </div>

                {status === "ready" && (
                  <button
                    type="button"
                    onClick={() => {
                      onMarkVisit?.();
                      onClaimDoor(door.id);
                    }}
                    className="rpg-depot-door-open mt-2 w-full rounded-lg border border-amber-500/50 bg-amber-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-100 hover:bg-amber-500/30"
                  >
                    Open door
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Active field perks
        </h3>
        {activePerks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No perks loaded. Complete album sets and open depot doors to equip
            bonuses for your next outing.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {activePerks.map((perk) => (
              <li
                key={perk.perkId}
                className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-violet-100">{perk.perkName}</p>
                    <p className="mt-0.5 text-xs text-violet-200/75">
                      {perk.perkDescription}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-violet-200">
                    {perk.chargesRemaining} left
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {onCraft && (
        <CitadelCraftPanel gameState={gameState} onCraft={onCraft} />
      )}

      <CompanionExportPanel gameState={gameState} embedded />
    </div>
  );
}
