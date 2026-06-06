import { supabase } from '../../lib/supabaseClient';
import type { IStorageAdapter } from './storageTypes';

type TableName = 'custom_tools' | 'saved_results' | 'chat_sessions' | 'workflow_progress' | 'favorites';

export class SupabaseAdapter implements IStorageAdapter {
  private table: TableName;
  private userIdField: string;

  constructor(table: TableName) {
    this.table = table;
    this.userIdField = 'user_id';
  }

  private async getUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  }

  async getItem<T>(key: string): Promise<T | null> {
    const userId = await this.getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq(this.userIdField, userId)
      .eq('id', key)
      .single();

    if (error || !data) return null;
    return data as T;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) throw new Error('User not authenticated');

    const record = { ...value as any, [this.userIdField]: userId, id: key };
    const { error } = await supabase
      .from(this.table)
      .upsert(record, { onConflict: 'id' });

    if (error) throw new Error(`Failed to save: ${error.message}`);
  }

  async removeItem(key: string): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) return;

    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq(this.userIdField, userId)
      .eq('id', key);

    if (error) throw new Error(`Failed to delete: ${error.message}`);
  }

  async clear(): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) return;

    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq(this.userIdField, userId);

    if (error) throw new Error(`Failed to clear: ${error.message}`);
  }

  async getAll<T>(): Promise<T[]> {
    const userId = await this.getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq(this.userIdField, userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch: ${error.message}`);
    return (data || []) as T[];
  }
}
