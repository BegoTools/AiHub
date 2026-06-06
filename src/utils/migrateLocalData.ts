import { supabase } from '../lib/supabaseClient';
import { ChatSession } from '../types/storageTypes';

const OLD_KEYS = [
  'ai_hub_custom_tools',
  'ai_tools_hub_favorites',
  'ai_tools_hub_history',
  'ai_hub_chat_sessions',
  'ai_hub_saved_results',
  'ai_tools_hub_settings',
];

export async function migrateFromLocalStorage(userId: string): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('local_migration_completed')
    .eq('id', userId)
    .single();

  if (profile?.local_migration_completed) return;

  try {
    await migrateFavorites(userId);
    await migrateChatSessions(userId);
    await migrateCustomTools(userId);
    await migrateSavedResults(userId);
    await migrateSettings(userId);
  } catch (e) {
    console.error('[Migration] Error during migration:', e);
    return;
  }

  await supabase
    .from('profiles')
    .update({ local_migration_completed: true })
    .eq('id', userId);

  clearLegacyKeys();
}

async function migrateFavorites(userId: string): Promise<void> {
  const raw = localStorage.getItem('ai_tools_hub_favorites');
  if (!raw) return;
  try {
    const favs = JSON.parse(raw);
    if (!Array.isArray(favs)) return;
    for (const itemId of favs) {
      if (typeof itemId !== 'string') continue;
      await supabase
        .from('favorites')
        .insert({ user_id: userId, item_id: itemId, item_type: 'tool' })
        .maybeSingle();
    }
  } catch {}
}

async function migrateChatSessions(userId: string): Promise<void> {
  const raw = localStorage.getItem('ai_hub_chat_sessions');
  if (!raw) return;
  try {
    const sessions: ChatSession[] = JSON.parse(raw);
    if (!Array.isArray(sessions)) return;
    for (const session of sessions) {
      await supabase
        .from('chat_sessions')
        .insert({
          id: session.id,
          user_id: userId,
          title: session.title,
          messages: session.messages as any,
          created_at: session.createdAt,
          updated_at: session.updatedAt,
        })
        .maybeSingle();
    }
  } catch {}
}

async function migrateCustomTools(userId: string): Promise<void> {
  const raw = localStorage.getItem('ai_hub_custom_tools');
  if (!raw) return;
  try {
    const tools = JSON.parse(raw);
    if (!Array.isArray(tools)) return;
    for (const tool of tools) {
      await supabase
        .from('custom_tools')
        .insert({
          id: tool.id,
          user_id: userId,
          title: tool.title || '',
          description: tool.description || '',
          category: tool.categoryId || 'general',
          icon: tool.icon || 'Sparkles',
          visibility: tool.visibility || 'private',
          prompt_template_string: tool.promptTemplateString || '',
          input_fields: tool.inputs || [],
          tags: tool.tags || [],
          created_at: tool.createdAt || new Date().toISOString(),
          updated_at: tool.updatedAt || new Date().toISOString(),
        })
        .maybeSingle();
    }
  } catch {}
}

async function migrateSavedResults(userId: string): Promise<void> {
  const raw = localStorage.getItem('ai_hub_saved_results');
  if (!raw) return;
  try {
    const results = JSON.parse(raw);
    if (!Array.isArray(results)) return;
    for (const r of results) {
      await supabase
        .from('saved_results')
        .insert({
          id: r.id,
          user_id: userId,
          tool_id: r.toolId || '',
          tool_name: r.toolName || '',
          title: r.title || '',
          content: r.content || '',
          type: r.type || 'text',
          source: r.source || 'generation',
          is_favorite: r.isFavorite || false,
          metadata: r.metadata || {},
          created_at: r.createdAt,
          updated_at: r.updatedAt,
        })
        .maybeSingle();
    }
  } catch {}

  const legacyRaw = localStorage.getItem('ai_tools_hub_history');
  if (legacyRaw) {
    try {
      const legacy = JSON.parse(legacyRaw);
      if (Array.isArray(legacy)) {
        for (const item of legacy) {
          await supabase
            .from('saved_results')
            .insert({
              id: item.id,
              user_id: userId,
              tool_id: item.toolId || '',
              tool_name: item.toolId || '',
              title: `نتيجة ${item.toolId}`,
              content: item.output || '',
              type: 'markdown',
              source: 'generation',
              metadata: { inputs: item.inputs || {}, provider: item.provider || 'gemini' },
              created_at: item.timestamp,
            })
            .maybeSingle();
        }
      }
    } catch {}
  }
}

async function migrateSettings(userId: string): Promise<void> {
  const raw = localStorage.getItem('ai_tools_hub_settings');
  if (raw) {
    try {
      const settings = JSON.parse(raw);
      await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          language: 'ar',
          theme: settings.theme || 'light',
        }, { onConflict: 'user_id' });
    } catch {}
  }

  const savedTheme = localStorage.getItem('ai_tools_hub_theme');
  const savedLang = localStorage.getItem('ai_hub_language');
  if (savedTheme || savedLang) {
    await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        language: savedLang || 'ar',
        theme: (savedTheme as 'light' | 'dim' | 'dark') || 'light',
      }, { onConflict: 'user_id' });
  }
}

function clearLegacyKeys(): void {
  for (const key of OLD_KEYS) {
    try { localStorage.removeItem(key); } catch {}
  }
  const progressPrefix = 'ai_hub_workflow_progress_';
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith(progressPrefix)) {
      try { localStorage.removeItem(key); } catch {}
    }
  }
}
