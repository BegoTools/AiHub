import { localStorageAdapter } from './storage/localStorageAdapter';
import { StoredResult } from '../types/storageTypes';

const STORAGE_KEY = 'ai_hub_saved_results';
const HISTORY_KEY = 'ai_tools_hub_history';

function generateId(): string {
  return `result_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// --- Legacy History support (for existing data migration) ---
interface LegacyHistoryItem {
  id: string;
  toolId: string;
  inputs: Record<string, string>;
  output: string;
  provider: string;
  timestamp: string;
}

export async function getSavedResults(): Promise<StoredResult[]> {
  const results = await localStorageAdapter.getItem<StoredResult[]>(STORAGE_KEY);
  if (Array.isArray(results) && results.length > 0) return results;

  // Migrate from legacy history format if exists
  const legacy = await localStorageAdapter.getItem<LegacyHistoryItem[]>(HISTORY_KEY);
  if (Array.isArray(legacy) && legacy.length > 0) {
    const migrated: StoredResult[] = legacy.map(item => ({
      id: item.id,
      title: `نتيجة ${item.toolId}`,
      toolId: item.toolId,
      toolName: item.toolId,
      content: item.output,
      type: 'markdown' as const,
      isFavorite: false,
      source: 'generation' as const,
      metadata: { inputs: item.inputs, provider: item.provider },
      createdAt: item.timestamp,
    }));
    await localStorageAdapter.setItem(STORAGE_KEY, migrated);
    // Don't delete legacy - other code may still use it
    return migrated;
  }
  return [];
}

export async function getSavedResultById(id: string): Promise<StoredResult | null> {
  const results = await getSavedResults();
  return results.find(r => r.id === id) || null;
}

export async function saveResult(result: Omit<StoredResult, 'createdAt' | 'updatedAt'>): Promise<StoredResult> {
  const results = await getSavedResults();
  const now = new Date().toISOString();
  const newResult: StoredResult = {
    ...result,
    createdAt: now,
  };
  results.unshift(newResult);
  await localStorageAdapter.setItem(STORAGE_KEY, results);
  return newResult;
}

export async function updateSavedResult(id: string, updates: Partial<StoredResult>): Promise<StoredResult | null> {
  const results = await getSavedResults();
  const index = results.findIndex(r => r.id === id);
  if (index === -1) return null;
  results[index] = { ...results[index], ...updates, updatedAt: new Date().toISOString() };
  await localStorageAdapter.setItem(STORAGE_KEY, results);
  return results[index];
}

export async function deleteSavedResult(id: string): Promise<boolean> {
  const results = await getSavedResults();
  const filtered = results.filter(r => r.id !== id);
  if (filtered.length === results.length) return false;
  await localStorageAdapter.setItem(STORAGE_KEY, filtered);
  return true;
}

export async function clearAllResults(): Promise<void> {
  await localStorageAdapter.setItem(STORAGE_KEY, []);
}

// TODO Future Backend:
// - Replace localStorageAdapter with Supabase adapter
// - Add user_id filtering
// - Add pagination
// - Add full-text search on content
