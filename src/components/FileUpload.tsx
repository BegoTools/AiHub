import { useState, useRef, type DragEvent } from 'react'
import { Upload, File, Image, FileText, Music, Video, AlertCircle, Loader2, Info } from 'lucide-react'
import { processUploadedFile, TEMP_FILE_NOTICE, type FileInfo } from '../services/fileService'

interface FileUploadProps {
  onFileProcessed: (file: FileInfo) => void
  accept?: string
  maxSize?: number
  t?: any
}

export default function FileUpload({ onFileProcessed, accept, t = {} }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError('')
    setProcessing(true)
    try {
      const info = await processUploadedFile(file)
      onFileProcessed(info)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setProcessing(false)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragOver(true) }
  const onDragLeave = () => setDragOver(false)

  const getIcon = () => {
    if (!accept) return <Upload size={32} />
    if (accept.includes('audio')) return <Music size={32} />
    if (accept.includes('image')) return <Image size={32} />
    if (accept.includes('pdf')) return <FileText size={32} />
    if (accept.includes('video')) return <Video size={32} />
    return <File size={32} />
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
          ${dragOver ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-slate-300 dark:border-zinc-700 hover:border-amber-400 dark:hover:border-amber-600 bg-white dark:bg-zinc-900/50'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        {processing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-amber-500" />
            <p className="text-sm text-slate-500 dark:text-zinc-400">جاري معالجة الملف...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`p-4 rounded-2xl ${dragOver ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'}`}>
              {getIcon()}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                {dragOver ? 'أفلت الملف هنا' : (t.dropFilesHere || 'اسحب وأفلت الملف هنا أو اضغط للاختيار')}
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                {accept ? `يدعم: ${accept}` : 'يدعم: صور, PDF, صوت, فيديو'}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>{TEMP_FILE_NOTICE}</span>
      </div>
    </div>
  )
}
