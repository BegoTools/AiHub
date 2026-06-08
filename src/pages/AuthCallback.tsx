import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

const CUSTOM_SCHEME = 'com.aihub.tools://auth/callback';
const REDIRECT_TIMEOUT_MS = 3000;

function log(tag: string, msg: string, data?: any) {
  const ts = new Date().toISOString().slice(11, 23);
  if (data) {
    console.log(`[${ts}][${tag}] ${msg}`, data);
  } else {
    console.log(`[${ts}][${tag}] ${msg}`);
  }
}

function detectNative(): boolean {
  try {
    return !!(window as any)?.Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

function redirectToApp(code: string): void {
  const url = `${CUSTOM_SCHEME}?code=${encodeURIComponent(code)}`;
  log('Redirect', `Attempting redirect to: ${url}`);

  // Method 1: window.location.replace (most reliable)
  try {
    window.location.replace(url);
    log('Redirect', 'Called window.location.replace');
  } catch (e) {
    log('Redirect', `location.replace failed: ${e}`);
  }

  // Method 2: If replace doesn't work (some browsers), try href
  setTimeout(() => {
    if (document.hidden) return;
    try {
      window.location.href = url;
      log('Redirect', 'Called window.location.href (fallback)');
    } catch (e) {
      log('Redirect', `location.href failed: ${e}`);
    }
  }, 200);
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [showReturnBtn, setShowReturnBtn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const redirectAttempted = useRef(false);

  const code = searchParams.get('code');
  const urlError = searchParams.get('error') || searchParams.get('error_description');

  useEffect(() => {
    const fullUrl = window.location.href;
    log('AuthCallback', `Mounted. URL: ${fullUrl}`);
    log('AuthCallback', `Code: ${code ? 'present' : 'missing'}, Error: ${urlError || 'none'}`);
    log('AuthCallback', `Native platform: ${detectNative()}`);

    let cancelled = false;

    const cleanUrl = () => {
      const clean = window.location.pathname;
      window.history.replaceState({}, document.title, clean);
    };

    const finish = async () => {
      if (urlError) {
        log('AuthCallback', `URL error: ${urlError}`);
        setError(urlError);
        setShowReturnBtn(true);
        return;
      }

      // Check if already authenticated (session exists)
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (session) {
        log('AuthCallback', 'Session already exists - user is authenticated');
        setIsAuthenticated(true);
        cleanUrl();

        if (detectNative()) {
          redirectToApp(code || '');
        } else {
          navigate('/home', { replace: true });
        }
        return;
      }

      // If we have a code, try to redirect to app
      if (code) {
        log('AuthCallback', `Authorization code: ${code.slice(0, 20)}...`);

        // Try redirect via Supabase exchange first (for web flow)
        if (!detectNative()) {
          log('AuthCallback', 'Web flow: exchanging code...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelled) return;
          if (error) {
            log('AuthCallback', `Exchange error: ${error.message}`);
            setError(error.message);
            setShowReturnBtn(true);
          }
          // onAuthStateChange will handle navigation to home
        } else {
          // Native flow: redirect to app via custom scheme
          log('AuthCallback', 'Native flow: redirecting via custom scheme...');
          redirectToApp(code);

          // Wait for possible redirect, show button if no redirect happens
          setTimeout(() => {
            if (cancelled || document.hidden) return;

            log('AuthCallback', 'Page still visible after timeout - redirect may have failed');
            setShowReturnBtn(true);

            // Subscribe to auth state in case exchange happened via appUrlOpen
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
              if (cancelled) return;
              if (event === 'SIGNED_IN' && session) {
                log('AuthCallback', 'Session detected via auth state change');
                setIsAuthenticated(true);
                setShowReturnBtn(false);
              }
            });

            // Also poll for session
            const pollInterval = setInterval(async () => {
              if (cancelled) return;
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                log('AuthCallback', 'Session detected via polling');
                setIsAuthenticated(true);
                setShowReturnBtn(false);
                clearInterval(pollInterval);
                subscription.unsubscribe();
              }
            }, 1000);

            setTimeout(() => {
              clearInterval(pollInterval);
              subscription.unsubscribe();
            }, 20000);
          }, REDIRECT_TIMEOUT_MS);
        }
      } else {
        // No code in URL - try onAuthStateChange (might be deferred)
        log('AuthCallback', 'No code in URL, waiting for auth state...');
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (cancelled) return;
          if (event === 'SIGNED_IN' && session) {
            log('AuthCallback', 'Auth state change detected SIGNED_IN');
            cleanUrl();
            navigate('/home', { replace: true });
          }
        });

        setTimeout(() => {
          if (cancelled) return;
          subscription.unsubscribe();
          setError('لم يتم استلام رمز التحقق. حاول مرة أخرى.');
          setShowReturnBtn(true);
        }, 15000);
      }
    };

    finish();

    return () => { cancelled = true; };
  }, [navigate, code, urlError]);

  const handleReturnToApp = () => {
    log('AuthCallback', 'User clicked return to app button');

    if (isAuthenticated) {
      if (detectNative()) {
        window.location.replace(CUSTOM_SCHEME);
      } else {
        navigate('/home', { replace: true });
      }
      return;
    }

    if (code) {
      redirectToApp(code);
      setTimeout(() => {
        if (!document.hidden) {
          setShowReturnBtn(true);
        }
      }, 2000);
    } else {
      navigate('/home', { replace: true });
    }
  };

  const goHome = () => {
    navigate('/home', { replace: true });
  };

  if (isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-fade-in" dir="rtl">
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-3xl flex flex-col items-center gap-4 max-w-sm text-center">
          <CheckCircle size={40} className="text-emerald-500" />
          <div>
            <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              تم تسجيل الدخول بنجاح ✅
            </h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
              يمكنك العودة إلى التطبيق الآن
            </p>
          </div>
          <button
            onClick={handleReturnToApp}
            className="mt-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            العودة إلى التطبيق
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-fade-in" dir="rtl">
        <div className="p-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 max-w-md">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
        <button
          onClick={goHome}
          className="mt-6 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in" dir="rtl">
      {!showReturnBtn ? (
        <>
          <Loader2 size={32} className="animate-spin text-amber-500" />
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {detectNative()
              ? 'جاري تحويلك إلى التطبيق...'
              : 'جاري تسجيل الدخول...'}
          </p>
          {detectNative() && code && (
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">
              إذا لم يتم تحويلك تلقائياً، اضغط على الزر أدناه
            </p>
          )}
        </>
      ) : (
        <>
          {code && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-center max-w-sm">
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                  لم نتمكن من فتح التطبيق تلقائياً
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  اضغط على الزر أدناه للعودة إلى التطبيق
                </p>
              </div>
              <button
                onClick={handleReturnToApp}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg"
              >
                <ArrowLeft size={18} />
                العودة إلى التطبيق
              </button>
              <button
                onClick={goHome}
                className="text-xs text-slate-500 dark:text-zinc-400 hover:text-amber-500 underline cursor-pointer"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
