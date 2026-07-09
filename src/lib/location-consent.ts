const CONSENT_KEY = "gpsrpg-location-consent-v1";
const GAME_STATE_KEY = "gpsrpg-game-state-v1";

export type LocationConsent = "live" | "demo";

export function readLocationConsent(): LocationConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const value = localStorage.getItem(CONSENT_KEY);
    if (value === "live" || value === "demo") return value;
  } catch {
    // Ignore storage errors; treat as no prior consent.
  }

  return null;
}

/** Existing saves predate explicit consent — treat as live GPS for continuity. */
export function inferLegacyLiveConsent(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(GAME_STATE_KEY) !== null;
  } catch {
    return false;
  }
}

export function writeLocationConsent(consent: LocationConsent): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // Consent still applies for the current session even if storage fails.
  }
}
