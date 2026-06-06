import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { migrateFromLocalStorage } from '../utils/migrateLocalData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
  message?: string;
}

type AuthView = 'login' | 'signup';

export default function AuthModal({ isOpen, onClose, t, message }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError(t.authError || 'Please fill in all fields');
      return;
    }

    if (view === 'signup' && password !== confirmPassword) {
      setError(t.authError || 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError(t.authError || 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    if (view === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) migrateFromLocalStorage(user.id);
        onClose();
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        setError(null);
        setView('login');
      }
    }

    setLoading(false);
  };

  const switchView = () => {
    setView(view === 'login' ? 'signup' : 'login');
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-8 text-right"
          >
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-zinc-100">
                {view === 'login' ? (t.authLoginTitle || 'Sign In') : (t.authSignupTitle || 'Sign Up')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
                {t.authModalSubtitle}
              </p>
            </div>

            {message && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-700 dark:text-amber-300 mb-4 font-medium">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                  {t.email || 'Email'}
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    dir="ltr"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-slate-100 rounded-xl px-4 py-2.5 pr-10 text-xs focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                  {t.password || 'Password'}
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-slate-100 rounded-xl px-4 py-2.5 pr-10 text-xs focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {view === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                    {t.confirmPassword || 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-slate-100 rounded-xl px-4 py-2.5 pr-10 text-xs focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading
                  ? (view === 'login' ? (t.loggingIn || 'Signing in...') : (t.signingUp || 'Creating account...'))
                  : (view === 'login' ? (t.authLoginTitle || 'Sign In') : (t.authSignupTitle || 'Sign Up'))
                }
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={switchView}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                {view === 'login' ? (t.createAccount || 'Create an account') : (t.haveAccount || 'Already have an account?')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
