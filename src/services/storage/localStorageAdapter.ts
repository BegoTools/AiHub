import { IStorageAdapter } from './storageTypes';

export class LocalStorageAdapter implements IStorageAdapter {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error(`[LocalStorageAdapter] Failed to get item "${key}":`, e);
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[LocalStorageAdapter] Failed to set item "${key}":`, e);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`[LocalStorageAdapter] Failed to remove item "${key}":`, e);
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('[LocalStorageAdapter] Failed to clear storage:', e);
    }
  }
}

// Singleton instance
export const localStorageAdapter = new LocalStorageAdapter();
