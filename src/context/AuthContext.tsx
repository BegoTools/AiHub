import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithFacebook: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const isNative = Capacitor.isNativePlatform();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle Supabase auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle OAuth callback via Capacitor deep-link (Android)
  useEffect(() => {
    if (!isNative) return;

    const handleUrlOpen = async (event: { url: string }) => {
      const url = event.url;
      if (!url || !url.startsWith('com.aihub.tools://auth/callback')) return;

      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('[Auth] Code exchange error:', error.message);
          } else {
            await Browser.close();
          }
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error('[Auth] Failed to handle callback URL:', e);
      }
    };

    const handleUrlOpenError = () => {
      Browser.close();
    };

    const listener = App.addListener('appUrlOpen', handleUrlOpen);
    const listenerErr = App.addListener('appRestoredResult', handleUrlOpenError);
    return () => {
      listener.then(l => l.remove());
      listenerErr.then(l => l.remove());
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signInWithFacebook = async (): Promise<{ error: string | null }> => {
    try {
      const redirectTo = isNative
        ? 'com.aihub.tools://auth/callback'
        : `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo }
      });

      if (error) return { error: error.message };

      if (isNative && data?.url) {
        await Browser.open({ url: data.url });
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return { error: 'تم إلغاء تسجيل الدخول' };
        }
      }

      return { error: null };
    } catch (e: any) {
      return { error: e?.message ?? 'Facebook login failed' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithFacebook, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
