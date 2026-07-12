export type MapPoiTapAction = "select" | "explore" | "blocked";

/**
 * Map interaction is deliberately two-step on mobile:
 * 1. First tap identifies/selects a site in-place.
 * 2. A second tap on that same selected site may explore it.
 *
 * Eligibility is supplied by the existing game-side explore validator so this
 * helper never invents a second range/visited rule set.
 */
export function getMapPoiTapAction(
  selectedPoiId: string | null,
  tappedPoiId: string,
  canExplore: boolean
): MapPoiTapAction {
  if (selectedPoiId !== tappedPoiId) return "select";
  return canExplore ? "explore" : "blocked";
}
