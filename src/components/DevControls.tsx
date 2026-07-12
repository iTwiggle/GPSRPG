"use client";

import { DEMO_LOCATION_LABEL } from "@/lib/types";

interface DevControlsProps {
  isDemo: boolean;
  gpsStatus: string;
  fantasyGridEnabled: boolean;
  streetReferenceMode: boolean;
  onToggleFantasyGrid: (enabled: boolean) => void;
  onToggleStreetReference: (enabled: boolean) => void;
  onEnableDemo: () => void;
  onNudge: (north: number, east: number) => void;
  onReset: () => void;
  onRefreshTasks?: () => void;
}

const NUDGE_METERS = 40;
const RANDOM_NEARBY_RADIUS_METERS = 1_000;

export default function DevControls({
  isDemo,
  gpsStatus,
  fantasyGridEnabled,
  streetReferenceMode,
  onToggleFantasyGrid,
  onToggleStreetReference,
  onEnableDemo,
  onNudge,
  onReset,
  onRefreshTasks,
}: DevControlsProps) {
  const handleRandomNearby = () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * RANDOM_NEARBY_RADIUS_METERS;
    onEnableDemo();
    onNudge(Math.cos(angle) * radius, Math.sin(angle) * radius);
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">Dev / Desktop tools</p>
          <p className="text-xs text-amber-800">
            Status: {gpsStatus}
            {isDemo ? ` (${DEMO_LOCATION_LABEL})` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEnableDemo}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-amber-100"
          >
            Switch to Demo Mode
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-amber-100"
          >
            Reset save
          </button>
          {onRefreshTasks && (
            <button
              type="button"
              onClick={onRefreshTasks}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-amber-100"
            >
              New Contracts
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-amber-200/80 bg-white/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
          Map surface (session)
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onToggleFantasyGrid(!fantasyGridEnabled)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
              fantasyGridEnabled
                ? "border-violet-400 bg-violet-100 text-violet-900"
                : "border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
            }`}
          >
            Fantasy atlas: {fantasyGridEnabled ? "On" : "Off"}
          </button>
          <button
            type="button"
            onClick={() => onToggleStreetReference(!streetReferenceMode)}
            disabled={!fantasyGridEnabled}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-45 ${
              streetReferenceMode
                ? "border-sky-400 bg-sky-100 text-sky-900"
                : "border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
            }`}
          >
            Street reference: {streetReferenceMode ? "On" : "Off"}
          </button>
        </div>
        <p className="mt-2 text-xs text-amber-800">
          Fantasy atlas keeps OSM as subdued geographic structure and draws stable authored world motifs above it. Street reference exposes the underlying roads for debug.
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRandomNearby}
          className="rounded-lg border border-violet-400 bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-900 hover:bg-violet-200"
        >
          Random nearby
        </button>
        <span className="self-center text-xs text-amber-800">
          Sample a fresh point within 1 km of the fixed Demo Location.
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 max-w-xs">
        <span />
        <button
          type="button"
          onClick={() => onNudge(NUDGE_METERS, 0)}
          className="rounded-lg border border-amber-300 bg-white px-2 py-1.5 text-xs font-medium hover:bg-amber-100"
        >
          North
        </button>
        <span />
        <button
          type="button"
          onClick={() => onNudge(0, -NUDGE_METERS)}
          className="rounded-lg border border-amber-300 bg-white px-2 py-1.5 text-xs font-medium hover:bg-amber-100"
        >
          West
        </button>
        <button
          type="button"
          onClick={onEnableDemo}
          className="rounded-lg border border-amber-300 bg-white px-2 py-1.5 text-xs font-medium hover:bg-amber-100"
        >
          Reset demo pos
        </button>
        <button
          type="button"
          onClick={() => onNudge(0, NUDGE_METERS)}
          className="rounded-lg border border-amber-300 bg-white px-2 py-1.5 text-xs font-medium hover:bg-amber-100"
        >
          East
        </button>
        <span />
        <button
          type="button"
          onClick={() => onNudge(-NUDGE_METERS, 0)}
          className="rounded-lg border border-amber-300 bg-white px-2 py-1.5 text-xs font-medium hover:bg-amber-100"
        >
          South
        </button>
        <span />
      </div>
      <p className="mt-2 text-xs text-amber-800">
        Nudge moves your position ~{NUDGE_METERS} m per tap. Use Simulate visit on a POI to bypass distance.
      </p>
    </div>
  );
}
