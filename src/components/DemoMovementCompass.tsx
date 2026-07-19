"use client";

interface DemoMovementCompassProps {
  onNudge: (northMeters: number, eastMeters: number) => void;
  onResetPosition: () => void;
}

const NUDGE_METERS = 40;

function pulse(pattern: number | number[] = 8) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Dev-only feedback must never interfere with map movement.
  }
}

export default function DemoMovementCompass({
  onNudge,
  onResetPosition,
}: DemoMovementCompassProps) {
  const nudge = (northMeters: number, eastMeters: number) => {
    pulse();
    onNudge(northMeters, eastMeters);
  };

  const reset = () => {
    pulse([10, 24, 10]);
    onResetPosition();
  };

  return (
    <div className="rpg-demo-compass" aria-label="Demo movement controls">
      <span />
      <button
        type="button"
        onClick={() => nudge(NUDGE_METERS, 0)}
        aria-label="Move north 40 meters"
      >
        <span aria-hidden="true">▲</span>
      </button>
      <span />
      <button
        type="button"
        onClick={() => nudge(0, -NUDGE_METERS)}
        aria-label="Move west 40 meters"
      >
        <span aria-hidden="true">◀</span>
      </button>
      <button
        type="button"
        onClick={reset}
        className="rpg-demo-compass__center"
        aria-label="Reset Demo position and recenter map"
      >
        <span aria-hidden="true">◎</span>
      </button>
      <button
        type="button"
        onClick={() => nudge(0, NUDGE_METERS)}
        aria-label="Move east 40 meters"
      >
        <span aria-hidden="true">▶</span>
      </button>
      <span />
      <button
        type="button"
        onClick={() => nudge(-NUDGE_METERS, 0)}
        aria-label="Move south 40 meters"
      >
        <span aria-hidden="true">▼</span>
      </button>
      <span />
    </div>
  );
}
