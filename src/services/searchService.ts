import type { SearchResponse } from '../types/aiTypes'

export async function searchWithAI(query: string): Promise<SearchResponse> {
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data
  } catch (error: any) {
    return {
      success: false,
      summary: '',
      results: [],
      error: error.message || 'فشل البحث. حاول مرة أخرى.',
    }
  }
}
