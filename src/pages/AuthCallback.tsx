import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const cleanUrl = () => {
      const clean = window.location.pathname;
      window.history.replaceState({}, document.title, clean);
    };

    const finish = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (cancelled) return;

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (session) {
        cleanUrl();
        navigate('/home', { replace: true });
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return;
        if (event === 'SIGNED_IN' && session) {
          cleanUrl();
          navigate('/home', { replace: true });
        }
      });

      setTimeout(() => {
        if (cancelled) return;
        subscription.unsubscribe();
        setError('لم يتم تسجيل الدخول. حاول مرة أخرى.');
      }, 15000);
    };

    finish();

    return () => { cancelled = true; };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-fade-in" dir="rtl">
        <div className="p-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 max-w-md">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="mt-6 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in" dir="rtl">
      <Loader2 size={32} className="animate-spin text-amber-500" />
      <p className="text-sm text-slate-500 dark:text-zinc-400">جاري تسجيل الدخول...</p>
    </div>
  );
}
