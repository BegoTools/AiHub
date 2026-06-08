import { searchInternet } from './router'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { query } = body

    if (!query || String(query).trim() === '') {
      return res.status(400).json({ error: 'استعلام البحث مطلوب.' })
    }

    const result = await searchInternet(query)

    return res.status(200).json({
      success: true,
      summary: result.summary,
      results: result.results,
    })
  } catch (error: any) {
    console.error('[search] Error:', error?.message)
    return res.status(500).json({ error: error.message || 'فشل البحث.' })
  }
}
