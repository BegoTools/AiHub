import { useState } from 'react'
import { Image, Sparkles, Loader2, AlertCircle, Download } from 'lucide-react'
import { routeRequest } from '../services/aiRouter'
import type { AiRouterResponse } from '../types/aiTypes'

const STYLES = [
  { value: '', label: 'بدون تخصيص' },
  { value: 'realistic', label: 'واقعي' },
  { value: 'anime', label: 'أنمي' },
  { value: 'cinematic', label: 'سينمائي' },
  { value: 'digital-art', label: 'فن رقمي' },
  { value: 'oil-painting', label: 'لوحة زيتية' },
]

export default function ImageToolsPage() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('')
  const [result, setResult] = useState<AiRouterResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResult(null)

    const resp = await routeRequest({
      taskType: 'image',
      prompt,
      style,
    })

    setLoading(false)
    setResult(resp)
  }

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const el = document.createElement('a')
      el.href = URL.createObjectURL(blob)
      el.download = `ai_image_${Date.now()}.png`
      el.click()
      URL.revokeObjectURL(el.href)
    } catch {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-2xl w-fit mx-auto mb-3">
          <Image size={28} />
        </div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-100">توليد الصور بالذكاء الاصطناعي</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">صف الصورة اللي في بالك وشاهد الإبداع</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="صف الصورة المطلوبة بالتفصيل... مثال: منظر غروب شمس على شاطئ استوائي بألوان دافئة"
          rows={3}
          className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl p-4 text-sm resize-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 outline-none transition-all"
        />

        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block mb-1.5">النمط الفني</label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map(s => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  style === s.value
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-purple-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              جاري إنشاء الصورة...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              إنشاء الصورة
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6">
            {result.success && result.imageUrl ? (
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800">
                  <img
                    src={result.imageUrl}
                    alt="Generated"
                    className="w-full h-auto max-h-[500px] object-contain bg-slate-100 dark:bg-zinc-950"
                  />
                </div>
                <button
                  onClick={() => handleDownload(result.imageUrl!)}
                  className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={14} />
                  تحميل الصورة
                </button>
                {result.providerUsed && (
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center">
                    تم التوليد بواسطة: {result.providerUsed}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl">
                <AlertCircle size={18} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
