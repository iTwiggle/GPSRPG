import type { EncounterResult } from "@/lib/types";

export const ROUTINE_REPORT_DISMISS_MS = 5_500;

/**
 * Routine finds should get out of the player's way. Discoveries, completed
 * sets, and rare pulls stay until dismissed so important information is not
 * lost while the player is walking or using assistive technology.
 */
export function encounterReportDismissMs(
  encounter: EncounterResult
): number | null {
  const isImportant =
    encounter.loot.some((item) => item.rarity === "rare") ||
    (encounter.newCodexItemKeys?.length ?? 0) > 0 ||
    (encounter.completedSetIds?.length ?? 0) > 0;

  return isImportant ? null : ROUTINE_REPORT_DISMISS_MS;
}
