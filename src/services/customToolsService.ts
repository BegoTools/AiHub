import { localStorageAdapter } from './storage/localStorageAdapter';
import { StoredCustomTool } from '../types/storageTypes';

const STORAGE_KEY = 'ai_hub_custom_tools';

function generateId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function getCustomTools(): Promise<StoredCustomTool[]> {
  const tools = await localStorageAdapter.getItem<StoredCustomTool[]>(STORAGE_KEY);
  return tools || [];
}

export async function getCustomToolById(id: string): Promise<StoredCustomTool | null> {
  const tools = await getCustomTools();
  return tools.find(t => t.id === id) || null;
}

export async function createCustomTool(tool: Omit<StoredCustomTool, 'createdAt' | 'updatedAt' | 'likesCount' | 'usesCount'>): Promise<StoredCustomTool> {
  const tools = await getCustomTools();
  const now = new Date().toISOString();
  const newTool: StoredCustomTool = {
    ...tool,
    likesCount: 0,
    usesCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  tools.push(newTool);
  await localStorageAdapter.setItem(STORAGE_KEY, tools);
  return newTool;
}

export async function updateCustomTool(id: string, updates: Partial<StoredCustomTool>): Promise<StoredCustomTool | null> {
  const tools = await getCustomTools();
  const index = tools.findIndex(t => t.id === id);
  if (index === -1) return null;
  tools[index] = { ...tools[index], ...updates, updatedAt: new Date().toISOString() };
  await localStorageAdapter.setItem(STORAGE_KEY, tools);
  return tools[index];
}

export async function deleteCustomTool(id: string): Promise<boolean> {
  const tools = await getCustomTools();
  const filtered = tools.filter(t => t.id !== id);
  if (filtered.length === tools.length) return false;
  await localStorageAdapter.setItem(STORAGE_KEY, filtered);
  return true;
}

export async function duplicateCustomTool(id: string): Promise<StoredCustomTool | null> {
  const original = await getCustomToolById(id);
  if (!original) return null;
  const duplicate: Omit<StoredCustomTool, 'createdAt' | 'updatedAt' | 'likesCount' | 'usesCount'> = {
    ...original,
    id: generateId(),
    title: `${original.title} (نسخة)`,
    visibility: 'private',
    tags: [...original.tags],
  };
  return createCustomTool(duplicate);
}

// TODO Future Backend:
// - Replace localStorageAdapter with Supabase adapter
// - Add user_id filtering for multi-user support
// - Add RLS policies for visibility
// - Add pagination for community tools
