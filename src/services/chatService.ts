import { supabase } from '../lib/supabaseClient';
import { ChatSession } from '../types/storageTypes';

export async function getChatSessions(): Promise<ChatSession[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[chatService] Failed to load sessions:', error);
    return [];
  }

  return (data || []).map(mapRowToSession);
}

export async function getChatSessionById(id: string): Promise<ChatSession | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;
  return mapRowToSession(data);
}

export async function createChatSession(title: string): Promise<ChatSession> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: user.id,
      title,
      messages: [],
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return mapRowToSession(data);
}

export async function addMessageToSession(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, any>
): Promise<ChatSession | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const session = await getChatSessionById(sessionId);
  if (!session) return null;

  const newMessage = {
    id: `msg_${Date.now()}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    metadata,
  };

  const messages = [...session.messages, newMessage];

  const { data, error } = await supabase
    .from('chat_sessions')
    .update({
      messages: messages as any,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) return null;
  return mapRowToSession(data);
}

export async function deleteChatSession(id: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

export async function clearAllChatSessions(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('chat_sessions')
    .delete()
    .eq('user_id', user.id);
}

function mapRowToSession(row: any): ChatSession {
  return {
    id: row.id,
    title: row.title || 'Chat',
    messages: row.messages || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
