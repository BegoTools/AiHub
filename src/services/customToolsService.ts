import { supabase } from '../lib/supabaseClient';
import { StoredCustomTool } from '../types/storageTypes';

export async function getCustomTools(): Promise<StoredCustomTool[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('custom_tools')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[customToolsService] Failed to load tools:', error);
    return [];
  }

  return (data || []).map(mapRowToTool);
}

export async function getAllPublicTools(): Promise<StoredCustomTool[]> {
  const { data, error } = await supabase
    .from('custom_tools')
    .select('*')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[customToolsService] Failed to load public tools:', error);
    return [];
  }

  return (data || []).map(mapRowToTool);
}

export async function getCustomToolById(id: string): Promise<StoredCustomTool | null> {
  const { data, error } = await supabase
    .from('custom_tools')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapRowToTool(data);
}

export async function incrementToolUseCount(toolId: string): Promise<boolean> {
  const { error } = await supabase.rpc('increment_tool_uses', { tool_id: toolId });
  return !error;
}

export async function createCustomTool(
  tool: Omit<StoredCustomTool, 'createdAt' | 'updatedAt' | 'likesCount' | 'usesCount'>
): Promise<StoredCustomTool> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const row: Record<string, any> = {
    user_id: user.id,
    title: tool.title,
    description: tool.description,
    category: tool.category,
    icon: tool.icon || 'Sparkles',
    visibility: tool.visibility,
    prompt_template_string: tool.promptTemplateString,
    input_fields: tool.inputFields as any,
    tags: tool.tags,
  };
  if (tool.createdByName) {
    row.created_by_name = tool.createdByName;
  }

  const { data, error } = await supabase
    .from('custom_tools')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to create tool: ${error.message}`);
  return mapRowToTool(data);
}

export async function updateCustomTool(
  id: string,
  updates: Partial<StoredCustomTool>
): Promise<StoredCustomTool | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const row: Record<string, any> = {};
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.icon !== undefined) row.icon = updates.icon;
  if (updates.visibility !== undefined) row.visibility = updates.visibility;
  if (updates.promptTemplateString !== undefined) row.prompt_template_string = updates.promptTemplateString;
  if (updates.inputFields !== undefined) row.input_fields = updates.inputFields as any;
  if (updates.tags !== undefined) row.tags = updates.tags;
  if (updates.likesCount !== undefined) row.likes_count = updates.likesCount;
  if (updates.usesCount !== undefined) row.uses_count = updates.usesCount;
  row.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('custom_tools')
    .update(row)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) return null;
  return mapRowToTool(data);
}

export async function deleteCustomTool(id: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('custom_tools')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

export async function duplicateCustomTool(id: string): Promise<StoredCustomTool | null> {
  const original = await getCustomToolById(id);
  if (!original) return null;

  return createCustomTool({
    ...original,
    title: `${original.title} (نسخة)`,
    visibility: 'private',
    tags: [...original.tags],
  });
}

function mapRowToTool(row: any): StoredCustomTool {
  if (!row) return null as any;
  return {
    id: row.id || '',
    ownerId: row.user_id || '',
    title: row.title || '',
    description: row.description || '',
    category: row.category || 'general',
    icon: row.icon || 'Sparkles',
    visibility: row.visibility || 'private',
    promptTemplateString: row.prompt_template_string || '',
    inputFields: Array.isArray(row.input_fields) ? row.input_fields : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    likesCount: typeof row.likes_count === 'number' ? row.likes_count : 0,
    usesCount: typeof row.uses_count === 'number' ? row.uses_count : 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    createdByName: row.created_by_name || 'مستخدم',
  };
}
