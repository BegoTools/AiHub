import { transcribeAudio } from './router'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { audio, fileName, action } = body

    if (!audio) {
      return res.status(400).json({ error: 'الملف الصوتي مطلوب.' })
    }

    if (action === 'transcribe') {
      const result = await transcribeAudio(audio, fileName || 'audio.mp3')

      const geminiKey = process.env.GEMINI_API_KEY
      if (result.text && geminiKey) {
        const { generateText } = await import('./router')
        try {
          const summary = await generateText(`لخص النص التالي باللغة العربية:\n\n${result.text}`)
          return res.status(200).json({
            success: true,
            transcript: result.text,
            summary: summary.result,
            provider: result.provider,
          })
        } catch {
          return res.status(200).json({
            success: true,
            transcript: result.text,
            summary: '',
            provider: result.provider,
          })
        }
      }

      return res.status(200).json({
        success: true,
        transcript: result.text,
        provider: result.provider,
      })
    }

    return res.status(400).json({ error: 'إجراء غير معروف.' })
  } catch (error: any) {
    console.error('[audio] Error:', error?.message)
    return res.status(500).json({ error: error.message || 'فشل معالجة الملف الصوتي.' })
  }
}
