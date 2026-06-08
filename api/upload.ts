export const config = {
  api: {
    bodyParser: false,
  },
}

const MAX_FILE_SIZE = 50 * 1024 * 1024

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  pdf: ['application/pdf'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg'],
  video: ['video/mp4', 'video/quicktime'],
  text: ['text/plain', 'text/csv'],
}

function getFileCategory(mimeType: string): string | null {
  for (const [category, types] of Object.entries(ALLOWED_TYPES)) {
    if (types.includes(mimeType)) return category
  }
  return null
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', () => resolve(Buffer.concat(chunks)))
      req.on('error', reject)
    })

    const contentType = req.headers['content-type'] || ''
    const fileName = req.headers['x-file-name'] || 'file'
    const fileSize = parseInt(req.headers['x-file-size'] || '0', 10)

    if (fileSize > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'حجم الملف يتجاوز الحد المسموح (50MB).' })
    }

    const category = getFileCategory(contentType)
    if (!category) {
      return res.status(400).json({ error: 'نوع الملف غير مدعوم.' })
    }

    const base64 = buffer.toString('base64')

    return res.status(200).json({
      success: true,
      data: {
        id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: fileName,
        size: fileSize,
        type: contentType,
        category,
        base64,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('[upload] Error:', error?.message)
    return res.status(500).json({ error: 'فشل رفع الملف.' })
  }
}
