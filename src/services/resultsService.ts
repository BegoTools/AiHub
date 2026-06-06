import { supabase } from '../lib/supabaseClient';
import { StoredResult } from '../types/storageTypes';

export async function getSavedResults(): Promise<StoredResult[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('saved_results')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[resultsService] Failed to load results:', error);
    return [];
  }

  return (data || []).map(mapRowToResult);
}

export async function getSavedResultById(id: string): Promise<StoredResult | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('saved_results')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;
  return mapRowToResult(data);
}

export async function saveResult(
  result: Omit<StoredResult, 'createdAt' | 'updatedAt'>
): Promise<StoredResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const row = {
    user_id: user.id,
    tool_id: result.toolId,
    tool_name: result.toolName,
    title: result.title,
    content: result.content,
    type: result.type,
    source: result.source,
    is_favorite: result.isFavorite,
    metadata: result.metadata || {},
  };

  const { data, error } = await supabase
    .from('saved_results')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to save result: ${error.message}`);
  return mapRowToResult(data);
}

export async function updateSavedResult(
  id: string,
  updates: Partial<StoredResult>
): Promise<StoredResult | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const row: Record<string, any> = {};
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.content !== undefined) row.content = updates.content;
  if (updates.isFavorite !== undefined) row.is_favorite = updates.isFavorite;
  if (updates.type !== undefined) row.type = updates.type;
  if (updates.metadata !== undefined) row.metadata = updates.metadata;
  row.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('saved_results')
    .update(row)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) return null;
  return mapRowToResult(data);
}

export async function deleteSavedResult(id: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('saved_results')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

export async function clearAllResults(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('saved_results')
    .delete()
    .eq('user_id', user.id);
}

function mapRowToResult(row: any): StoredResult {
  return {
    id: row.id,
    title: row.title || '',
    toolId: row.tool_id || '',
    toolName: row.tool_name || '',
    content: row.content || '',
    type: row.type || 'text',
    isFavorite: row.is_favorite || false,
    source: row.source || 'generation',
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
