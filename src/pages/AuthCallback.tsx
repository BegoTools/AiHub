import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Loader2, AlertCircle } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('جاري تسجيل الدخول...')

  const code = searchParams.get('code')
  const urlError = searchParams.get('error') || searchParams.get('error_description')

  useEffect(() => {
    if (window.location.hash === '#_=_') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }

    if (urlError) {
      setError(urlError)
      return
    }

    if (!code) {
      setError('لم يتم استلام رمز التحقق. حاول مرة أخرى.')
      return
    }

    let cancelled = false;

    (async () => {
      setStatus('جاري تبادل رمز التحقق...')
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (cancelled) return

      if (exchangeError) {
        setError(exchangeError.message)
        return
      }

      navigate('/home', { replace: true })
    })()

    return () => { cancelled = true }
  }, [navigate, code, urlError])

  const goHome = () => navigate('/home', { replace: true })

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-fade-in" dir="rtl">
        <div className="p-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 max-w-md">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
        <button onClick={goHome} className="mt-6 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm rounded-xl transition-all cursor-pointer">
          العودة للرئيسية
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in" dir="rtl">
      <Loader2 size={32} className="animate-spin text-amber-500" />
      <p className="text-sm text-slate-500 dark:text-zinc-400">{status}</p>
    </div>
  )
}
