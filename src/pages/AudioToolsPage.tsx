import { useState, useEffect } from 'react'
import { Mic, Loader2, AlertCircle, Download, FileText } from 'lucide-react'
import { routeRequest } from '../services/aiRouter'
import type { AiRouterResponse } from '../types/aiTypes'
import FileUpload from '../components/FileUpload'
import FilePreview from '../components/FilePreview'
import { clearFile, clearAllTempFiles } from '../services/fileService'
import type { FileInfo } from '../services/fileService'

export default function AudioToolsPage() {
  const [audioFile, setAudioFile] = useState<FileInfo | null>(null)
  const [result, setResult] = useState<AiRouterResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    return () => { if (audioFile) clearFile(audioFile); clearAllTempFiles() }
  }, [])

  const handleTranscribe = async () => {
    if (!audioFile) return
    setLoading(true)
    setResult(null)
    const file = audioFile

    const resp = await routeRequest({
      taskType: 'audio',
      file: file.base64,
      fileName: file.name,
      mimeType: file.type,
    })

    setLoading(false)
    if (resp.success) {
      clearFile(file)
      setAudioFile(null)
    }
    setResult(resp)
  }

  const downloadText = (text: string, filename: string) => {
    const el = document.createElement('a')
    el.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    el.download = filename
    el.click()
    URL.revokeObjectURL(el.href)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-2xl w-fit mx-auto mb-3">
          <Mic size={28} />
        </div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-100">تحويل الصوت إلى نص</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">ارفع ملف صوتي واستخرج النص تلقائياً مع تلخيص ذكي</p>
      </div>

      {!audioFile ? (
        <FileUpload
          onFileProcessed={setAudioFile}
          accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/ogg"
        />
      ) : (
        <div className="space-y-4">
          <FilePreview file={audioFile} onRemove={() => { setAudioFile(null); setResult(null) }} />

          <button
            onClick={handleTranscribe}
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                جاري تحويل الصوت...
              </>
            ) : (
              <>
                <Mic size={16} />
                بدء التحويل
              </>
            )}
          </button>
        </div>
      )}

      {result && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 space-y-4">
            {result.success ? (
              <>
                <div>
                  <h3 className="font-bold text-sm text-slate-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                    <FileText size={16} className="text-emerald-500" />
                    النص المستخرج
                  </h3>
                  <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {result.result}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => downloadText(result.result || '', `transcript_${Date.now()}.txt`)}
                    className="flex-1 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={14} />
                    تحميل النص
                  </button>
                </div>
              </>
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
