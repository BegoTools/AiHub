import { X, File, FileText, Music, Image, Video } from 'lucide-react'
import { formatFileSize } from '../services/fileService'
import type { FileInfo } from '../services/fileService'

interface FilePreviewProps {
  file: FileInfo
  onRemove: () => void
}

export default function FilePreview({ file, onRemove }: FilePreviewProps) {
  const getIcon = () => {
    if (file.category === 'image') return <Image size={20} />
    if (file.category === 'audio') return <Music size={20} />
    if (file.category === 'pdf') return <FileText size={20} />
    if (file.category === 'video') return <Video size={20} />
    return <File size={20} />
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl">
      {file.previewUrl && file.category === 'image' ? (
        <img src={file.previewUrl} alt={file.name} className="w-10 h-10 rounded-lg object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500">
          {getIcon()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 truncate">{file.name}</p>
        <p className="text-[10px] text-slate-400 dark:text-zinc-500">{formatFileSize(file.size)}</p>
      </div>
      <button onClick={onRemove} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer">
        <X size={14} />
      </button>
    </div>
  )
}
