import { useState, useEffect } from 'react'
import { Sparkles, Mic, Image, Search, FileText, Zap, Globe } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { routeRequest } from '../services/aiRouter'
import type { AiRouterResponse } from '../types/aiTypes'
import FileUpload from '../components/FileUpload'
import FilePreview from '../components/FilePreview'
import OutputView from '../components/OutputView'
import { clearFile, clearAllTempFiles } from '../services/fileService'
import type { FileInfo } from '../services/fileService'

interface DashboardPageProps {
  t: any
}

const quickActions = [
  { id: 'audio', icon: Mic, label: 'تحويل الصوت لنص', desc: 'Speech-to-Text', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', route: '/audio-tools' },
  { id: 'image', icon: Image, label: 'توليد الصور', desc: 'AI Image Generation', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20', route: '/image-tools' },
  { id: 'search', icon: Globe, label: 'البحث الذكي', desc: 'AI Search Engine', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20', route: '/search' },
  { id: 'text', icon: FileText, label: 'معالجة النصوص', desc: 'Text AI Tools', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20', route: '/tools' },
]

export default function DashboardPage({ t }: DashboardPageProps) {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<FileInfo | null>(null)

  useEffect(() => {
    return () => { if (uploadedFile) clearFile(uploadedFile); clearAllTempFiles() }
  }, [])

  const handleSubmit = async () => {
    if (!prompt.trim() && !uploadedFile) return
    setLoading(true)
    setResult('')
    const file = uploadedFile

    const resp = file
      ? await routeRequest({ taskType: 'audio', prompt: prompt || 'حول هذا الملف الصوتي إلى نص', file: file.base64, fileName: file.name, mimeType: file.type })
      : await routeRequest({ taskType: 'text', prompt })

    setLoading(false)
    if (resp.success) {
      setResult(resp.imageUrl ? `![Generated Image](${resp.imageUrl})` : (resp.result || ''))
      if (file) { clearFile(file); setUploadedFile(null) }
    } else {
      setResult(`**خطأ**: ${resp.error}`)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-zinc-100 mb-2">
          {t.dashboardTitle || 'مسرح الذكاء الاصطناعي'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-lg mx-auto">
          {t.dashboardDesc || 'مساحة عمل ذكية متكاملة. ارفع، اكتب، واترك للذكاء الاصطناعي الباقي.'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map(action => (
          <button
            key={action.id}
            onClick={() => navigate(action.route)}
            className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-right transition-all hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group"
          >
            <div className={`p-2.5 ${action.bg} ${action.color} rounded-xl mb-3 w-fit group-hover:scale-110 transition-transform`}>
              <action.icon size={18} />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">{action.label}</h3>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* AI Prompt Input */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-sm text-slate-700 dark:text-zinc-300 flex items-center gap-2">
          <Zap size={16} className="text-amber-500" />
          {t.aiPromptTitle || 'اطلب أي شيء'}
        </h2>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t.aiPromptPlaceholder || 'اكتب طلبك هنا... توليد نص، تحليل، ترجمة، بحث، أو أي شيء!'}
          rows={3}
          className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl p-4 text-sm resize-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 outline-none transition-all"
        />

        {/* File Upload */}
        {!uploadedFile ? (
          <FileUpload onFileProcessed={setUploadedFile} t={t} />
        ) : (
          <FilePreview file={uploadedFile} onRemove={() => setUploadedFile(null)} />
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || (!prompt.trim() && !uploadedFile)}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles size={16} />
              {t.generate || 'توليد'}
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <OutputView
          tool={{ id: 'ai-assistant', categoryId: 'general', title: t.dashboardTitle || 'AI Workspace', description: '', icon: 'Sparkles', inputs: [], exampleInput: {}, promptTemplate: () => '' }}
          output={result}
          onClear={() => setResult('')}
          isLoading={false}
          t={t}
        />
      )}
    </div>
  )
}
