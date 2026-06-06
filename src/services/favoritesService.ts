import { localStorageAdapter } from './storage/localStorageAdapter';

const STORAGE_KEY = 'ai_tools_hub_favorites';

export async function getFavorites(): Promise<string[]> {
  const favs = await localStorageAdapter.getItem<string[]>(STORAGE_KEY);
  return Array.isArray(favs) ? favs : [];
}

export async function addFavorite(toolId: string): Promise<string[]> {
  const favs = await getFavorites();
  if (!favs.includes(toolId)) {
    favs.push(toolId);
    await localStorageAdapter.setItem(STORAGE_KEY, favs);
  }
  return favs;
}

export async function removeFavorite(toolId: string): Promise<string[]> {
  const favs = await getFavorites();
  const filtered = favs.filter(id => id !== toolId);
  if (filtered.length !== favs.length) {
    await localStorageAdapter.setItem(STORAGE_KEY, filtered);
  }
  return filtered;
}

export async function isFavorite(toolId: string): Promise<boolean> {
  const favs = await getFavorites();
  return favs.includes(toolId);
}

export async function toggleFavorite(toolId: string): Promise<{ isFav: boolean; favorites: string[] }> {
  const favs = await getFavorites();
  if (favs.includes(toolId)) {
    const updated = favs.filter(id => id !== toolId);
    await localStorageAdapter.setItem(STORAGE_KEY, updated);
    return { isFav: false, favorites: updated };
  } else {
    favs.push(toolId);
    await localStorageAdapter.setItem(STORAGE_KEY, favs);
    return { isFav: true, favorites: favs };
  }
}

// TODO Future Backend:
// - Replace localStorageAdapter with Supabase adapter
// - Add favorites table with user_id and item_type
// - Add unique constraint on (user_id, item_id)
