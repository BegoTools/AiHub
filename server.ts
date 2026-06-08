import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const MAX_FILE_SIZE = 50 * 1024 * 1024
const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  pdf: ['application/pdf'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg'],
  video: ['video/mp4', 'video/quicktime'],
  text: ['text/plain', 'text/csv'],
}

function isTransientError(error: any): boolean {
  const text = JSON.stringify(error).toLowerCase()
  return text.includes('503') || text.includes('unavailable') || text.includes('overloaded') ||
    text.includes('high demand') || text.includes('resource has been exhausted') || text.includes('quota') ||
    text.includes('timeout') || text.includes('429')
}

async function callGemini(apiKey: string, prompt: string, model?: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey })
  const chosenModel = model || 'gemini-2.0-flash'
  const response = await Promise.race([
    ai.models.generateContent({ model: chosenModel, contents: prompt }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 60000)),
  ])
  return (response as any).text || ''
}

async function callOpenRouter(apiKey: string, prompt: string, model?: string): Promise<string> {
  const chosenModel = model || 'google/gemini-2.0-flash:free'
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'HTTP-Referer': 'https://ais-dev.europe-west2.run.app', 'X-Title': 'AI Tools Hub' },
    body: JSON.stringify({ model: chosenModel, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(60000),
  })
  if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.error?.message || `HTTP ${response.status}`) }
  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callOpenAI(apiKey: string, prompt: string, model?: string): Promise<string> {
  const chosenModel = model || 'gpt-4o-mini'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: chosenModel, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(60000),
  })
  if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.error?.message || `HTTP ${response.status}`) }
  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function generateText(prompt: string): Promise<{ result: string; provider: string; model: string }> {
  const geminiKey = process.env.GEMINI_API_KEY
  const openrouterKey = process.env.OPENROUTER_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  const providers = [
    { name: 'gemini', key: geminiKey, model: 'gemini-2.0-flash', call: () => callGemini(geminiKey!, prompt, 'gemini-2.0-flash') },
    { name: 'openrouter', key: openrouterKey, model: 'google/gemini-2.0-flash:free', call: () => callOpenRouter(openrouterKey!, prompt, 'google/gemini-2.0-flash:free') },
    { name: 'openai', key: openaiKey, model: 'gpt-4o-mini', call: () => callOpenAI(openaiKey!, prompt, 'gpt-4o-mini') },
  ].filter(p => p.key)
  let lastError: any = null
  for (const provider of providers) {
    try { const result = await provider.call(); return { result, provider: provider.name, model: provider.model } }
    catch (error: any) { lastError = error; if (!isTransientError(error)) continue }
  }
  throw new Error(lastError?.message || 'جميع مزودي الخدمة غير متاحين حالياً.')
}

async function generateTextWithSystem(prompt: string, systemInstruction: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    const ai = new GoogleGenAI({ apiKey: geminiKey })
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt, config: { systemInstruction } })
    return (response as any).text || ''
  }
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: systemInstruction }, { role: 'user', content: prompt }] }),
      signal: AbortSignal.timeout(60000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }
  throw new Error('لا يوجد مزود متاح.')
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Route: Generate AI Content (Smart Router)
  app.post('/api/generate', async (req, res) => {
    try {
      const { prompt, provider, model } = req.body;
      if (!prompt) return res.status(400).json({ error: 'حقل النص المطلوب (prompt) فارغ.' });
      const result = await generateText(prompt)
      return res.json(result)
    } catch (err: any) {
      console.error('[generate] Error:', err?.message);
      return res.status(500).json({ error: err.message || 'حدث خطأ داخلي' });
    }
  });

  // API Route: File Upload
  app.post('/api/upload', async (req, res) => {
    try {
      const { file, fileName, fileType, fileSize } = req.body
      if (!file) return res.status(400).json({ error: 'الملف مطلوب.' })
      if (fileSize > MAX_FILE_SIZE) return res.status(413).json({ error: 'حجم الملف يتجاوز 50MB.' })
      const category = Object.entries(ALLOWED_TYPES).find(([, types]) => types.includes(fileType))?.[0]
      if (!category) return res.status(400).json({ error: 'نوع الملف غير مدعوم.' })
      return res.status(200).json({ success: true, data: { id: `file_${Date.now()}`, name: fileName, size: fileSize, type: fileType, category, base64: file, createdAt: new Date().toISOString() } })
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'فشل رفع الملف.' })
    }
  })

  // API Route: Audio Processing
  app.post('/api/audio', async (req, res) => {
    try {
      const { audio, fileName, action } = req.body
      if (!audio) return res.status(400).json({ error: 'الملف الصوتي مطلوب.' })
      if (action === 'transcribe') {
        const openaiKey = process.env.OPENAI_API_KEY
        let transcript = ''
        if (openaiKey) {
          const buf = Buffer.from(audio, 'base64')
          const formData = new FormData()
          formData.append('file', new Blob([buf]), fileName || 'audio.mp3')
          formData.append('model', 'whisper-1')
          const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST', headers: { 'Authorization': `Bearer ${openaiKey}` }, body: formData,
            signal: AbortSignal.timeout(120000),
          })
          if (resp.ok) { const d = await resp.json(); transcript = d.text || '' }
        }
        if (!transcript) {
          const geminiKey = process.env.GEMINI_API_KEY
          if (geminiKey) {
            const ai = new GoogleGenAI({ apiKey: geminiKey })
            const resp = await ai.models.generateContent({
              model: 'gemini-2.0-flash',
              contents: [
                { text: 'اقرأ هذا الملف الصوتي وحول الكلام إلى نص مكتوب بالعربية. أعد فقط النص.' },
                { inlineData: { mimeType: 'audio/mp3', data: audio } },
              ],
            })
            transcript = (resp as any)?.text || ''
          }
        }
        if (!transcript) throw new Error('لم نتمكن من نسخ الملف الصوتي.')
        let summary = ''
        try { const s = await generateText(`لخص النص التالي بالعربية:\n\n${transcript}`); summary = s.result } catch {}
        return res.status(200).json({ success: true, transcript, summary })
      }
      return res.status(400).json({ error: 'إجراء غير معروف.' })
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'فشل معالجة الصوت.' })
    }
  })

  // API Route: Image Generation
  app.post('/api/generate-image', async (req, res) => {
    try {
      const { prompt, style } = req.body
      if (!prompt) return res.status(400).json({ error: 'النص مطلوب.' })
      const openaiKey = process.env.OPENAI_API_KEY
      if (openaiKey) {
        try {
          const stylePrompt = style ? `(${style}) ${prompt}` : prompt
          const resp = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
            body: JSON.stringify({ model: 'dall-e-3', prompt: stylePrompt, n: 1, size: '1024x1024' }),
            signal: AbortSignal.timeout(60000),
          })
          if (resp.ok) { const d = await resp.json(); return res.json({ success: true, imageUrl: d.data?.[0]?.url, provider: 'openai' }) }
        } catch {}
      }
      const geminiKey = process.env.GEMINI_API_KEY
      if (geminiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: geminiKey })
          const resp = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp-image-generation',
            contents: prompt,
            config: { generationConfig: { responseModalities: ['Text', 'Image'] } } as any,
          })
          const parts = (resp as any)?.candidates?.[0]?.content?.parts || []
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/'))
              return res.json({ success: true, imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, provider: 'gemini' })
          }
        } catch {}
      }
      throw new Error('لا يوجد مزود متاح لتوليد الصور.')
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'فشل إنشاء الصورة.' })
    }
  })

  // API Route: Internet Search
  app.post('/api/search', async (req, res) => {
    try {
      const { query } = req.body
      if (!query) return res.status(400).json({ error: 'استعلام البحث مطلوب.' })
      const result = await generateText(`أنت محرك بحث ذكي. ابحث في معرفتك حول: "${query}". قدم ملخصاً منظمًا بالمعلومة الأساسية والمصادر إن أمكن.`)
      return res.json({ success: true, summary: result.result, results: [] })
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'فشل البحث.' })
    }
  })

  // API Route: AI Chat Assistant
  app.post('/api/chat-assistant', async (req, res) => {
    const { message, existingTools, existingWorkflows, language } = req.body || {};
    const isArabic = language === 'ar';
    try {
      if (!message) return res.status(400).json({ error: isArabic ? 'حقل الرسالة فارغ.' : 'Message is empty.' });

      const formattedTools = Array.isArray(existingTools) ? existingTools.slice(0, 50).map((t: any) => ({ id: t.id, title: t.title, description: t.description, category: t.categoryId || '' })) : [];
      const formattedWorkflows = Array.isArray(existingWorkflows) ? existingWorkflows.slice(0, 20).map((wf: any) => ({ id: wf.id, title: wf.title, description: wf.description, category: wf.category || '' })) : [];

      const langInstruction = isArabic
        ? 'أنت المساعد الذكي لمستخدمي منصة أدوات الذكاء الاصطناعي العربية. تواصل مع المستخدم باللغة العربية.'
        : `You are the AI assistant for the AI Tools Hub platform. Communicate with the user in ${language === 'en' ? 'English' : language === 'de' ? 'German' : language === 'fr' ? 'French' : language === 'it' ? 'Italian' : 'English'}.`;

      const systemInstruction = `
${langInstruction}

Your task:
- Understand the user's request.
- If a suitable tool exists in existingTools, return JSON with action="match" and include toolId.
- If no suitable tool exists, set needCustomTool:true and provide newTool definition.
- Always include suggestedTools and suggestedWorkflows.
Available tools: ${JSON.stringify(formattedTools)}
Available workflows: ${JSON.stringify(formattedWorkflows)}
Return clean JSON only, no markdown.
Format: { "action":"chat","explanation":"...","suggestedTools":[],"suggestedWorkflows":[],"needCustomTool":false,"newTool":{...},"toolId":"..." }
`;

      const resultStr = await generateTextWithSystem(message, systemInstruction)
      let cleaned = resultStr.trim()
      cleaned = cleaned.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim()
      const start = cleaned.indexOf('{'); const end = cleaned.lastIndexOf('}')
      if (start !== -1 && end > start) cleaned = cleaned.slice(start, end + 1)
      const result = JSON.parse(cleaned)
      return res.status(200).json(result)
    } catch (err: any) {
      console.error('[chat-assistant] Error:', err?.message?.slice(0, 200))
      return res.status(500).json({
        action: 'chat',
        explanation: isArabic ? 'حدث خطأ مؤقت. حاول مرة أخرى.' : 'Temporary error. Please try again.',
        suggestedTools: [], suggestedWorkflows: [], needCustomTool: false
      })
    }
  });

  // Serve static assets or mount Vite Developer Server
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`[AI Tools Hub Server] running on http://localhost:${PORT}`);
  });
}

startServer();
