const TIMEOUT_MS = 60000

function isTransientError(error: any): boolean {
  const text = JSON.stringify(error).toLowerCase()
  return (
    text.includes('503') ||
    text.includes('unavailable') ||
    text.includes('overloaded') ||
    text.includes('high demand') ||
    text.includes('resource has been exhausted') ||
    text.includes('quota') ||
    text.includes('timeout') ||
    text.includes('429')
  )
}

function getModelForTask(taskType: string): string {
  const models: Record<string, string> = {
    text: 'gemini-2.0-flash',
    image: 'gemini-2.0-flash',
    audio: 'gemini-2.0-flash',
    search: 'gemini-2.0-flash',
  }
  return models[taskType] || 'gemini-2.0-flash'
}

async function callGemini(apiKey: string, prompt: string, model?: string, imageBase64?: string, imageMimeType?: string): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })
  const chosenModel = model || 'gemini-2.0-flash'
  const contents = imageBase64
    ? [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: imageMimeType || 'image/jpeg', data: imageBase64 } }] }]
    : prompt
  const response = await Promise.race([
    ai.models.generateContent({ model: chosenModel, contents }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
    ),
  ])
  return (response as any).text || ''
}

async function callOpenRouter(apiKey: string, prompt: string, model?: string, imageBase64?: string, imageMimeType?: string): Promise<string> {
  const chosenModel = model || 'google/gemini-2.0-flash:free'
  const content = imageBase64
    ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:${imageMimeType || 'image/jpeg'};base64,${imageBase64}` } }]
    : prompt
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://ais-dev.europe-west2.run.app',
      'X-Title': 'AI Tools Hub',
    },
    body: JSON.stringify({
      model: chosenModel,
      messages: [{ role: 'user', content }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.error?.message || `HTTP ${response.status}`)
  }
  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callGeminiImageGeneration(apiKey: string, prompt: string): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })
  const response = await Promise.race([
    ai.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
      contents: prompt,
      config: {
        generationConfig: { responseModalities: ['Text', 'Image'] }
      } as any,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
    ),
  ])
  const candidates = (response as any)?.candidates?.[0]?.content?.parts
  if (candidates) {
    for (const part of candidates) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        const base64 = part.inlineData.data
        const mime = part.inlineData.mimeType
        return `data:${mime};base64,${base64}`
      }
      if (part.text) return part.text
    }
  }
  throw new Error('لم يتم إنشاء الصورة')
}

export async function generateText(prompt: string, imageBase64?: string, imageMimeType?: string): Promise<{ result: string; provider: string; model: string }> {
  const geminiKey = process.env.GEMINI_API_KEY
  const openrouterKey = process.env.OPENROUTER_API_KEY

  const providers = [
    { name: 'gemini', key: geminiKey, call: () => callGemini(geminiKey!, prompt, getModelForTask('text'), imageBase64, imageMimeType), model: getModelForTask('text') },
    { name: 'openrouter', key: openrouterKey, call: () => callOpenRouter(openrouterKey!, prompt, 'google/gemini-2.0-flash:free', imageBase64, imageMimeType), model: 'google/gemini-2.0-flash:free' },
  ].filter(p => p.key)

  let lastError: any = null
  for (const provider of providers) {
    try {
      const result = await provider.call()
      return { result, provider: provider.name, model: provider.model }
    } catch (error: any) {
      lastError = error
      if (!isTransientError(error)) continue
    }
  }
  throw new Error(lastError?.message || 'جميع مزودي الخدمة غير متاحين حالياً.')
}

export async function transcribeAudio(audioBase64: string, fileName: string): Promise<{ text: string; provider: string }> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey: geminiKey })
    const prompt = 'اقرأ هذا الملف الصوتي وحول الكلام إلى نص مكتوب باللغة العربية. أعد فقط النص المكتوب بدون أي إضافات.'
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { text: prompt },
        { inlineData: { mimeType: fileName.endsWith('.mp3') ? 'audio/mp3' : 'audio/wav', data: audioBase64 } },
      ],
    })
    return { text: (response as any).text || '', provider: 'gemini' }
  }
  throw new Error('لا يوجد مزود متاح للنسخ الصوتي.')
}

export async function generateImage(prompt: string, style?: string): Promise<{ imageUrl: string; provider: string }> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    try {
      const imageUrl = await callGeminiImageGeneration(geminiKey, prompt)
      return { imageUrl, provider: 'gemini' }
    } catch {}
  }
  throw new Error('لا يوجد مزود متاح لتوليد الصور.')
}

export async function searchInternet(query: string): Promise<{ summary: string; results: { title: string; url: string; snippet: string }[] }> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) throw new Error('GEMINI_API_KEY غير متوفر')

  const response = await callGemini(geminiKey, `ابحث في معرفتك حول: "${query}". قدم ملخصاً منظمًا وأهم المعلومات مع المصادر إن أمكن.`, 'gemini-2.0-flash')
  return {
    summary: response,
    results: [],
  }
}
