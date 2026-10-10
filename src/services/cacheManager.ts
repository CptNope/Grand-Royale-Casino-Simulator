import { APP_VERSION_INFO } from '../version.ts';

export interface StorageBreakdown {
  localStorageBytes: number;
  sessionStorageBytes: number;
  cacheCount: number;
  cacheNames: string[];
  swRegistered: boolean;
  indexedDbSupported: boolean;
}

const VERSION_STORAGE_KEY = 'grand_royale_app_version';
const SCHEMA_STORAGE_KEY = 'grand_royale_schema_version';

export class CacheManager {
  /**
   * Check for version upgrades or schema changes upon startup.
   * Returns true if a newer version was detected.
   */
  static checkVersionUpgrade(): { isUpgrade: boolean; previousVersion: string | null } {
    try {
      const prevVersion = localStorage.getItem(VERSION_STORAGE_KEY);
      const prevSchema = localStorage.getItem(SCHEMA_STORAGE_KEY);

      const isUpgrade = prevVersion !== null && prevVersion !== APP_VERSION_INFO.version;

      // Always save current running version
      localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION_INFO.version);
      localStorage.setItem(SCHEMA_STORAGE_KEY, String(APP_VERSION_INFO.schemaVersion));

      return { isUpgrade, previousVersion: prevVersion };
    } catch {
      return { isUpgrade: false, previousVersion: null };
    }
  }

  /**
   * Inspect current browser storage usage for diagnostics
   */
  static async getStorageBreakdown(): Promise<StorageBreakdown> {
    let lsBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          lsBytes += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
        }
      }
    } catch {
      // ignore
    }

    let ssBytes = 0;
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          ssBytes += (key.length + (sessionStorage.getItem(key)?.length || 0)) * 2;
        }
      }
    } catch {
      // ignore
    }

    let cacheNames: string[] = [];
    if ('caches' in window) {
      try {
        cacheNames = await caches.keys();
      } catch {
        // ignore
      }
    }

    let swRegistered = false;
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        swRegistered = registrations.length > 0;
      } catch {
        // ignore
      }
    }

    return {
      localStorageBytes: lsBytes,
      sessionStorageBytes: ssBytes,
      cacheCount: cacheNames.length,
      cacheNames,
      swRegistered,
      indexedDbSupported: 'indexedDB' in window,
    };
  }

  /**
   * Performs an atomic hard cache clear:
   * 1. Unregisters all Service Workers
   * 2. Deletes all CacheStorage caches
   * 3. Clears SessionStorage
   * 4. Optional: Clears LocalStorage (or keeps user wallet/preferences if requested)
   * 5. Forces browser reload bypassing HTTP cache
   */
  static async performHardCacheClear(options: {
    preserveWalletData?: boolean;
    forceReload?: boolean;
  } = {}): Promise<{ success: boolean; clearedCaches: number; swUnregistered: number }> {
    const { preserveWalletData = false, forceReload = true } = options;

    let clearedCaches = 0;
    let swUnregistered = 0;

    // 1. Unregister all Service Worker registrations
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
          swUnregistered++;
        }
      } catch (err) {
        console.warn('Error unregistering service workers:', err);
      }
    }

    // 2. Delete all CacheStorage buckets
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
          clearedCaches++;
        }
      } catch (err) {
        console.warn('Error clearing caches:', err);
      }
    }

    // 3. Clear sessionStorage
    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }

    // 4. Handle localStorage
    try {
      if (preserveWalletData) {
        // Preserve casino state & audio prefs while wiping other cached keys
        const preservedState = localStorage.getItem('grand_royale_casino_static_state');
        const preservedMute = localStorage.getItem('grand_royale_sound_muted');
        
        localStorage.clear();

        if (preservedState) localStorage.setItem('grand_royale_casino_static_state', preservedState);
        if (preservedMute) localStorage.setItem('grand_royale_sound_muted', preservedMute);
        localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION_INFO.version);
        localStorage.setItem(SCHEMA_STORAGE_KEY, String(APP_VERSION_INFO.schemaVersion));
      } else {
        localStorage.clear();
      }
    } catch (err) {
      console.warn('Error clearing localStorage:', err);
    }

    // 5. Force hard reload bypassing cache
    if (forceReload) {
      setTimeout(() => {
        // Appending a cache-busting timestamp parameter forces non-cached HTTP request
        const url = new URL(window.location.href);
        url.searchParams.set('_purge', Date.now().toString());
        window.location.href = url.toString();
      }, 350);
    }

    return { success: true, clearedCaches, swUnregistered };
  }

  /**
   * Format bytes to readable string (e.g. 14.2 KB)
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
