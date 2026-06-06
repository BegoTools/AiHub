import { supabase } from '../lib/supabaseClient';

export async function getFavorites(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('favorites')
    .select('item_id')
    .eq('user_id', user.id);

  return (data || []).map(f => f.item_id);
}

export async function addFavorite(toolId: string): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  await supabase
    .from('favorites')
    .insert({ user_id: user.id, item_id: toolId, item_type: 'tool' })
    .maybeSingle();

  return getFavorites();
}

export async function removeFavorite(toolId: string): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('item_id', toolId);

  return getFavorites();
}

export async function isFavorite(toolId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', toolId)
    .single();

  return !!data;
}

export async function toggleFavorite(toolId: string): Promise<{ isFav: boolean; favorites: string[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isFav: false, favorites: [] };

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', toolId)
    .single();

  if (existing) {
    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('item_id', toolId);
  } else {
    await supabase
      .from('favorites')
      .insert({ user_id: user.id, item_id: toolId, item_type: 'tool' });
  }

  const updated = await getFavorites();
  return { isFav: !existing, favorites: updated };
}
