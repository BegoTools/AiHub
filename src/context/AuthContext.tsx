import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

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
      const redirectTo = `${window.location.origin}/auth/callback`;

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
