"use client";

interface LevelMedallionProps {
  level: number;
  progress: number;
  expanded?: boolean;
  onToggle: () => void;
}

export default function LevelMedallion({
  level,
  progress,
  expanded = false,
  onToggle,
}: LevelMedallionProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const degrees = clamped * 360;

  return (
    <button
      type="button"
      className={`rpg-level-medallion${expanded ? " rpg-level-medallion--open" : ""}`}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-haspopup="dialog"
      aria-label={`Level ${level}, ${Math.round(clamped * 100)}% to next level. Open traveler synopsis.`}
    >
      <span
        className="rpg-level-medallion__ring"
        style={{
          background: `conic-gradient(#f59e0b ${degrees}deg, rgba(148, 163, 184, 0.22) ${degrees}deg 360deg)`,
        }}
        aria-hidden="true"
      />
      <span className="rpg-level-medallion__core" aria-hidden="true">
        <span className="rpg-level-medallion__level">{level}</span>
      </span>
    </button>
  );
}
