const MAX_FILE_SIZE = 50 * 1024 * 1024

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  pdf: ['application/pdf'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg'],
  video: ['video/mp4', 'video/quicktime'],
  text: ['text/plain', 'text/csv'],
}

export interface FileInfo {
  id: string
  name: string
  size: number
  type: string
  category: string
  base64: string
  previewUrl?: string
}

export function getCategoryForType(mimeType: string): string | null {
  for (const [cat, types] of Object.entries(ALLOWED_TYPES)) {
    if (types.includes(mimeType)) return cat
  }
  return null
}

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return 'حجم الملف يتجاوز الحد المسموح (50MB).'
  const category = getCategoryForType(file.type)
  if (!category) return 'نوع الملف غير مدعوم.'
  return null
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] || result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function getFilePreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

export async function processUploadedFile(file: File): Promise<FileInfo> {
  const error = validateFile(file)
  if (error) throw new Error(error)

  const base64 = await readFileAsBase64(file)
  const category = getCategoryForType(file.type) || 'unknown'
  const previewUrl = category === 'image' || category === 'pdf' ? getFilePreviewUrl(file) : undefined

  return {
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    type: file.type,
    category,
    base64,
    previewUrl,
  }
}
