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

function log(tag: string, msg: string, data?: any) {
  const ts = new Date().toISOString().slice(11, 23);
  if (data) {
    console.log(`[${ts}][${tag}] ${msg}`, data);
  } else {
    console.log(`[${ts}][${tag}] ${msg}`);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    log('Auth', 'Checking existing session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      log('Auth', `Existing session: ${session ? 'found' : 'none'}`);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      log('Auth', `State change: ${event}, user: ${session?.user?.email || 'none'}`);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isNative) return;

    const handleUrlOpen = async (event: { url: string }) => {
      const url = event.url;
      log('DeepLink', `Received URL: ${url}`);

      if (!url || !url.startsWith('com.aihub.tools://auth/callback')) {
        log('DeepLink', 'Ignored - not our callback URL');
        return;
      }

      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        log('DeepLink', `Extracted code: ${code ? 'present' : 'missing'}`);

        if (code) {
          log('DeepLink', 'Exchanging code for session...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            log('DeepLink', `Exchange error: ${error.message}`);
          } else {
            log('DeepLink', 'Code exchange successful!');
            await Browser.close();
            log('DeepLink', 'Browser closed after successful auth');
          }
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        log('DeepLink', `Error handling callback: ${e}`);
      }
    };

    const handleUrlOpenError = () => {
      log('DeepLink', 'App restored with result (error case)');
      Browser.close();
    };

    log('DeepLink', 'Registering appUrlOpen listener...');
    const listener = App.addListener('appUrlOpen', handleUrlOpen);
    const listenerErr = App.addListener('appRestoredResult', handleUrlOpenError);
    return () => {
      listener.then(l => l.remove());
      listenerErr.then(l => l.remove());
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    log('Auth', `Sign in attempt: ${email}`);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) log('Auth', `Sign in error: ${error.message}`);
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    log('Auth', `Sign up attempt: ${email}`);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) log('Auth', `Sign up error: ${error.message}`);
    return { error: error?.message ?? null };
  };

  const waitForSession = async (maxRetries = 12, delayMs = 500): Promise<boolean> => {
    for (let i = 0; i < maxRetries; i++) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        log('Auth', `Session found after retry ${i + 1}/${maxRetries}`);
        return true;
      }
      log('Auth', `No session yet, retry ${i + 1}/${maxRetries}...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
    log('Auth', `Session not found after ${maxRetries} retries`);
    return false;
  };

  const signInWithFacebook = async (): Promise<{ error: string | null }> => {
    try {
      const redirectTo = isNative
        ? 'https://ai-hub-liart.vercel.app/auth/callback'
        : `${window.location.origin}/auth/callback`;

      log('OAuth', `Starting Facebook OAuth, redirectTo: ${redirectTo}`);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo }
      });

      if (error) {
        log('OAuth', `signInWithOAuth error: ${error.message}`);
        return { error: error.message };
      }

      log('OAuth', `OAuth URL received: ${data?.url?.slice(0, 80)}...`);

      if (isNative && data?.url) {
        log('OAuth', 'Opening browser...');
        await Browser.open({ url: data.url });

        log('OAuth', 'Browser closed. Waiting for session...');
        const hasSession = await waitForSession();

        if (!hasSession) {
          log('OAuth', 'No session after browser closed - auth failed');
          return { error: 'لم يتم تسجيل الدخول. يرجى المحاولة مرة أخرى.' };
        }

        log('OAuth', 'Facebook login successful!');
      }

      return { error: null };
    } catch (e: any) {
      log('OAuth', `Facebook login error: ${e?.message}`);
      return { error: e?.message ?? 'Facebook login failed' };
    }
  };

  const signOut = async () => {
    log('Auth', 'Signing out...');
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
