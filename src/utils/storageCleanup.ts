import { LOCAL_STORAGE_KEYS } from '../config/apiConfig';

const APP_STORAGE_VERSION_KEY = 'app_storage_version';
const CURRENT_STORAGE_VERSION = 1;

const APP_KEYS = [
  'ai_hub_custom_tools',
  'ai_hub_saved_results',
  'ai_hub_workflow_progress_',
  LOCAL_STORAGE_KEYS.FAVORITES,
  LOCAL_STORAGE_KEYS.HISTORY,
  LOCAL_STORAGE_KEYS.SETTINGS,
  LOCAL_STORAGE_KEYS.ONBOARDED,
  APP_STORAGE_VERSION_KEY,
];

const PROTECTED_KEYS = [
  'ai_hub_language',
  LOCAL_STORAGE_KEYS.THEME,
  'supabase-auth-token',
];

export function clearCorruptedLocalData(): void {
  const prefix = 'ai_hub_workflow_progress_';
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (PROTECTED_KEYS.includes(key)) continue;
    if (key.startsWith(prefix) || APP_KEYS.includes(key)) {
      localStorage.removeItem(key);
    }
  }
}

export function getStorageVersion(): number {
  try {
    const v = localStorage.getItem(APP_STORAGE_VERSION_KEY);
    if (v === null) return 0;
    const n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
}

export function setStorageVersion(): void {
  try {
    localStorage.setItem(APP_STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function checkAndMigrateStorage(): void {
  const version = getStorageVersion();
  if (version < CURRENT_STORAGE_VERSION) {
    clearCorruptedLocalData();
    setStorageVersion();
  }
}
