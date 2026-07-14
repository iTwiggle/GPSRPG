/** Central registry of all companion persistence keys (web + future Android). */

export const STORAGE_KEYS = {
  gameState: "gpsrpg-game-state-v1",
  explorationMemory: "gpsrpg-exploration-memory-v1",
  onboardingPoi: "gpsrpg-onboarding-poi-v1",
  osmContext: "gpsrpg-osm-context-v1",
  locationConsent: "gpsrpg-location-consent-v1",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const CORRUPT_SAVE_BACKUP_PREFIX = `${STORAGE_KEYS.gameState}-corrupt-`;

/** Keys cleared on a full player reset (consent is intentionally kept). */
export const RESETTABLE_STORAGE_KEYS: StorageKey[] = [
  STORAGE_KEYS.gameState,
  STORAGE_KEYS.explorationMemory,
  STORAGE_KEYS.onboardingPoi,
  STORAGE_KEYS.osmContext,
];
