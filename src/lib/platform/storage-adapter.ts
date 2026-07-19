/**
 * Platform-agnostic key-value storage.
 * Web uses localStorage; Android Capacitor will swap in Preferences later.
 */

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class WebStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Best-effort removal during reset flows.
    }
  }
}

let activeAdapter: StorageAdapter = new WebStorageAdapter();

export function getStorageAdapter(): StorageAdapter {
  return activeAdapter;
}

/** Test hook and future Capacitor registration point. */
export function setStorageAdapter(adapter: StorageAdapter): void {
  activeAdapter = adapter;
}

export function resetStorageAdapter(): void {
  activeAdapter = new WebStorageAdapter();
}
