import { supabase } from '../lib/supabaseClient';

export interface UserSettings {
  language: string;
  theme: 'light' | 'dim' | 'dark';
  onboarding_completed: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  language: 'ar',
  theme: 'dark',
  onboarding_completed: false,
};

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('language, theme, onboarding_completed')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return DEFAULT_SETTINGS;
  }

  return {
    language: data.language || DEFAULT_SETTINGS.language,
    theme: (data.theme as UserSettings['theme']) || DEFAULT_SETTINGS.theme,
    onboarding_completed: data.onboarding_completed || false,
  };
}

export async function upsertUserSettings(
  userId: string,
  updates: Partial<UserSettings>
): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('[userSettingsService] Failed to save settings:', error);
  }
}
