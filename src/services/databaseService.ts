import { SupabaseAdapter } from './storage/SupabaseAdapter';

export const db = {
  tools: new SupabaseAdapter('custom_tools'),
  results: new SupabaseAdapter('saved_results'),
  chat: new SupabaseAdapter('chat_sessions'),
  favorites: new SupabaseAdapter('favorites'),
  workflows: new SupabaseAdapter('workflow_progress'),
};
