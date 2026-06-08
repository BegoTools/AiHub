import { generateImage } from './router'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { prompt, style } = body

    if (!prompt || String(prompt).trim() === '') {
      return res.status(400).json({ error: 'النص المطلوب لإنشاء الصورة فارغ.' })
    }

    const result = await generateImage(prompt, style)

    return res.status(200).json({
      success: true,
      imageUrl: result.imageUrl,
      provider: result.provider,
    })
  } catch (error: any) {
    console.error('[generate-image] Error:', error?.message)
    return res.status(500).json({ error: error.message || 'فشل إنشاء الصورة.' })
  }
}
