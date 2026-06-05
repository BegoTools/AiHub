import { localStorageAdapter } from './storage/localStorageAdapter';
import { ChatSession } from '../types/storageTypes';

const STORAGE_KEY = 'ai_hub_chat_sessions';

function generateId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function getChatSessions(): Promise<ChatSession[]> {
  const sessions = await localStorageAdapter.getItem<ChatSession[]>(STORAGE_KEY);
  return sessions || [];
}

export async function getChatSessionById(id: string): Promise<ChatSession | null> {
  const sessions = await getChatSessions();
  return sessions.find(s => s.id === id) || null;
}

export async function createChatSession(title: string): Promise<ChatSession> {
  const sessions = await getChatSessions();
  const now = new Date().toISOString();
  const session: ChatSession = {
    id: generateId(),
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  sessions.push(session);
  await localStorageAdapter.setItem(STORAGE_KEY, sessions);
  return session;
}

export async function addMessageToSession(sessionId: string, role: 'user' | 'assistant', content: string, metadata?: Record<string, any>): Promise<ChatSession | null> {
  const sessions = await getChatSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return null;
  session.messages.push({
    id: `msg_${Date.now()}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    metadata,
  });
  session.updatedAt = new Date().toISOString();
  await localStorageAdapter.setItem(STORAGE_KEY, sessions);
  return session;
}

export async function deleteChatSession(id: string): Promise<boolean> {
  const sessions = await getChatSessions();
  const filtered = sessions.filter(s => s.id !== id);
  if (filtered.length === sessions.length) return false;
  await localStorageAdapter.setItem(STORAGE_KEY, filtered);
  return true;
}

export async function clearAllChatSessions(): Promise<void> {
  await localStorageAdapter.setItem(STORAGE_KEY, []);
}

// TODO Future Backend:
// - Replace localStorageAdapter with Supabase adapter
// - Add chat_sessions and chat_messages tables
// - Add real-time subscriptions for live chat
// - Add full-text search on messages
