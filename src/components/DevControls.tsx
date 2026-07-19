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
  onPreviewScoutsEye?: () => void;
  movementBoonsPreviewActive?: boolean;
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
  onPreviewScoutsEye,
  movementBoonsPreviewActive = false,
}: DevControlsProps) {
  const handleRandomNearby = () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * RANDOM_NEARBY_RADIUS_METERS;
    onEnableDemo();
    onNudge(Math.cos(angle) * radius, Math.sin(angle) * radius);
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold">Dev / Desktop tools</p>
          <p className="text-xs text-amber-800">
            Status: {gpsStatus}
            {isDemo ? ` (${DEMO_LOCATION_LABEL})` : ""}
          </p>
        </div>
        {onPreviewScoutsEye && (
          <button
            type="button"
            onClick={onPreviewScoutsEye}
            aria-pressed={movementBoonsPreviewActive}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              movementBoonsPreviewActive
                ? "border-cyan-500 bg-cyan-500 text-slate-950 shadow-[0_0_14px_rgba(6,182,212,0.45)]"
                : "border-sky-400 bg-white text-sky-900 hover:bg-sky-100"
            }`}
          >
            Boons: {movementBoonsPreviewActive ? "ON" : "OFF"}
          </button>
        )}
      </div>

      <details className="mt-2 rounded-lg border border-amber-200/80 bg-white/60">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide">Movement controls</summary>
        <div className="border-t border-amber-200/80 p-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleRandomNearby} className="rounded-lg border border-violet-400 bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-900">Random nearby</button>
            <button type="button" onClick={onEnableDemo} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium">Reset position</button>
          </div>
          <div className="mt-2 grid max-w-xs grid-cols-3 gap-2">
            <span /><button type="button" onClick={() => onNudge(NUDGE_METERS, 0)} className="rounded-lg border border-amber-300 bg-white py-1.5 text-xs font-medium">North</button><span />
            <button type="button" onClick={() => onNudge(0, -NUDGE_METERS)} className="rounded-lg border border-amber-300 bg-white py-1.5 text-xs font-medium">West</button>
            <span className="grid place-items-center text-[10px] text-amber-700">40 m</span>
            <button type="button" onClick={() => onNudge(0, NUDGE_METERS)} className="rounded-lg border border-amber-300 bg-white py-1.5 text-xs font-medium">East</button>
            <span /><button type="button" onClick={() => onNudge(-NUDGE_METERS, 0)} className="rounded-lg border border-amber-300 bg-white py-1.5 text-xs font-medium">South</button><span />
          </div>
        </div>
      </details>

      <details className="mt-2 rounded-lg border border-amber-200/80 bg-white/60">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide">Map surface</summary>
        <div className="border-t border-amber-200/80 p-3">
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
        </div>
      </details>

      <details className="mt-2 rounded-lg border border-amber-200/80 bg-white/60">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide">Maintenance</summary>
        <div className="flex flex-wrap gap-2 border-t border-amber-200/80 p-3">
          <button type="button" onClick={onEnableDemo} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium">Switch to Demo</button>
          {onRefreshTasks && <button type="button" onClick={onRefreshTasks} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium">New contracts</button>}
          <button type="button" onClick={onReset} className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-800">Reset save</button>
        </div>
      </details>
    </div>
  );
}
