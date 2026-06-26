"use client";

interface DevControlsProps {
  isDemo: boolean;
  gpsStatus: string;
  onEnableDemo: () => void;
  onNudge: (north: number, east: number) => void;
  onReset: () => void;
}

const NUDGE_METERS = 40;

export default function DevControls({
  isDemo,
  gpsStatus,
  onEnableDemo,
  onNudge,
  onReset,
}: DevControlsProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">Dev / Desktop tools</p>
          <p className="text-xs text-amber-800">
            Status: {gpsStatus}
            {isDemo ? " (demo position)" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEnableDemo}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-amber-100"
          >
            Demo mode
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-amber-100"
          >
            Reset save
          </button>
        </div>
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
          Reset pos
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
