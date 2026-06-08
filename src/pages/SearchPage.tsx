import { useState } from 'react'
import { Globe, Search, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { searchWithAI } from '../services/searchService'
import type { SearchResponse } from '../types/aiTypes'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    const resp = await searchWithAI(query)
    setLoading(false)
    setResult(resp)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-2xl w-fit mx-auto mb-3">
          <Globe size={28} />
        </div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-100">البحث الذكي</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">اسأل أي شيء واحصل على إجابة منظمة وذكية</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب سؤالك هنا... مثال: ما هي أحدث تطورات الذكاء الاصطناعي؟"
            className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl px-4 py-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 outline-none transition-all"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6">
            {result.success ? (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-700 dark:text-zinc-300">النتيجة</h3>
                <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {result.summary}
                </div>

                {result.results.length > 0 && (
                  <div>
                    <h3 className="font-bold text-sm text-slate-700 dark:text-zinc-300 mb-2">المصادر</h3>
                    <div className="space-y-2">
                      {result.results.map((r, i) => (
                        <a
                          key={i}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all text-xs group"
                        >
                          <ExternalLink size={12} className="text-blue-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-700 dark:text-zinc-300 truncate group-hover:text-blue-500">{r.title}</p>
                            <p className="text-slate-400 dark:text-zinc-500 truncate">{r.snippet}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
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
