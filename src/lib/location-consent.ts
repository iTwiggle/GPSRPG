import { STORAGE_KEYS } from "@/lib/platform/storage-keys";
import { getStorageAdapter } from "@/lib/platform/storage-adapter";

export type LocationConsent = "live" | "demo";

export function readLocationConsent(): LocationConsent | null {
  if (typeof window === "undefined") return null;

  const storage = getStorageAdapter();

  try {
    const value = storage.getItem(STORAGE_KEYS.locationConsent);
    if (value === "live" || value === "demo") return value;
  } catch {
    // Ignore storage errors; treat as no prior consent.
  }

  return null;
}

/** Existing saves predate explicit consent — treat as live GPS for continuity. */
export function inferLegacyLiveConsent(): boolean {
  if (typeof window === "undefined") return false;

  const storage = getStorageAdapter();

  try {
    return storage.getItem(STORAGE_KEYS.gameState) !== null;
  } catch {
    return false;
  }
}

export function writeLocationConsent(consent: LocationConsent): void {
  if (typeof window === "undefined") return;

  const storage = getStorageAdapter();

  try {
    storage.setItem(STORAGE_KEYS.locationConsent, consent);
  } catch {
    // Consent still applies for the current session even if storage fails.
  }
}
