"use client";

import ParticleBurst from "@/components/feedback/ParticleBurst";

interface LevelUpCelebrationProps {
  level: number;
  reducedMotion: boolean;
}

/**
 * Center-screen "LEVEL N" beat. Earned progression should always land with a
 * deliberate pause — this is the one moment we let bloom fully.
 */
export default function LevelUpCelebration({
  level,
  reducedMotion,
}: LevelUpCelebrationProps) {
  return (
    <div
      className={
        reducedMotion
          ? "rpg-levelup rpg-levelup--reduced"
          : "rpg-levelup"
      }
      role="status"
      aria-live="assertive"
    >
      {!reducedMotion && (
        <div className="rpg-levelup__particles">
          <ParticleBurst count={26} color="rgba(251, 191, 36, 0.98)" seed={level} />
        </div>
      )}
      <div className="rpg-levelup__card">
        <p className="rpg-levelup__eyebrow">Level Up</p>
        <p className="rpg-levelup__level">Level {level}</p>
      </div>
    </div>
  );
}
