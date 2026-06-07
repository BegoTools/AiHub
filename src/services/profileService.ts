import { supabase } from '../lib/supabaseClient';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, created_at')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: { display_name?: string; avatar_url?: string }
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, ...updates },
      { onConflict: 'id' }
    );

  if (error) {
    console.error('[profileService] upsert error:', error.message, error.details, error.hint);
    throw new Error(error.message);
  }
}
