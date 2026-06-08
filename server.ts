import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { registerFile, getFile, deleteFile, cleanupExpired, getStats } from './api/temp-storage';

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

async function callGemini(apiKey: string, prompt: string, model?: string, imageBase64?: string, imageMimeType?: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey })
  const chosenModel = model || 'gemini-2.0-flash'
  console.log("=== callGemini INSPECTION ===");
  console.log("imageBase64 truthy?", !!imageBase64);
  console.log("imageBase64 length:", imageBase64 ? imageBase64.length : 0);
  console.log("imageMimeType:", imageMimeType);
  console.log("prompt sample:", prompt?.substring(0, 100));
  console.log("chosenModel:", chosenModel);
  const contents = imageBase64
    ? [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: imageMimeType || 'image/jpeg', data: imageBase64 } }] }]
    : prompt
  const response = await Promise.race([
    ai.models.generateContent({ model: chosenModel, contents }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 60000)),
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
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'HTTP-Referer': 'https://ais-dev.europe-west2.run.app', 'X-Title': 'AI Tools Hub' },
    body: JSON.stringify({ model: chosenModel, messages: [{ role: 'user', content }] }),
    signal: AbortSignal.timeout(60000),
  })
  if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.error?.message || `HTTP ${response.status}`) }
  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function generateText(prompt: string, imageBase64?: string, imageMimeType?: string): Promise<{ result: string; provider: string; model: string }> {
  const geminiKey = process.env.GEMINI_API_KEY
  const openrouterKey = process.env.OPENROUTER_API_KEY
  const providers = [
    { name: 'gemini', key: geminiKey, model: 'gemini-2.0-flash', call: () => callGemini(geminiKey!, prompt, 'gemini-2.0-flash', imageBase64, imageMimeType) },
    { name: 'openrouter', key: openrouterKey, model: 'google/gemini-2.0-flash:free', call: () => callOpenRouter(openrouterKey!, prompt, 'google/gemini-2.0-flash:free', imageBase64, imageMimeType) },
  ].filter(p => p.key)
  let lastError: any = null
  for (const provider of providers) {
    try { const result = await provider.call(); return { result, provider: provider.name, model: provider.model } }
    catch (error: any) { lastError = error }
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
  throw new Error('لا يوجد مزود متاح.')
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Global error handler for body-parser & other middleware errors — always returns JSON
  app.use((err: any, _req: any, res: any, next: any) => {
    if (err) {
      console.error('[Express Global Error]', err.type || err.name, err.message?.slice(0, 200));
      return res.status(err.status || 500).json({ error: err.message || 'خطأ داخلي في الخادم.' });
    }
    next();
  });

  // API Route: Generate AI Content (Smart Router, supports image+text multimodal)
  app.post('/api/generate', async (req, res) => {
    try {
      const { prompt, provider, model, imageBase64, imageMimeType } = req.body;
      console.log("=== IMAGE INCOMING INSPECTION ===");
      console.log("Headers Content-Type:", req.headers['content-type']);
      console.log("Body Keys:", Object.keys(req.body));
      console.log("imageBase64 present?", !!imageBase64);
      console.log("imageMimeType:", imageMimeType);
      console.log("imageBase64 length:", imageBase64 ? imageBase64.length : 0);
      console.log("prompt length:", prompt?.length || 0);
      if (!prompt) return res.status(400).json({ error: 'حقل النص المطلوب (prompt) فارغ.' });
      const result = await generateText(prompt, imageBase64, imageMimeType)
      return res.json(result)
    } catch (err: any) {
      console.error('[generate] Error:', err?.message);
      return res.status(500).json({ error: err.message || 'حدث خطأ داخلي' });
    }
  });

  // API Route: File Upload (ephemeral — temp storage with TTL)
  app.post('/api/upload', async (req, res) => {
    try {
      const { file, fileName, fileType, fileSize } = req.body
      if (!file) return res.status(400).json({ error: 'الملف مطلوب.' })
      if (fileSize > MAX_FILE_SIZE) return res.status(413).json({ error: 'حجم الملف يتجاوز 50MB.' })
      const category = Object.entries(ALLOWED_TYPES).find(([, types]) => types.includes(fileType))?.[0]
      if (!category) return res.status(400).json({ error: 'نوع الملف غير مدعوم.' })
      const tempFile = registerFile(fileName || 'file', fileSize || 0, fileType || '', category, file, 30 * 60 * 1000)
      return res.status(200).json({
        success: true,
        data: { id: tempFile.id, name: tempFile.name, size: tempFile.size, type: tempFile.type, category: tempFile.category, base64: tempFile.data, createdAt: new Date(tempFile.createdAt).toISOString(), ttl: tempFile.ttl, isTemporary: true },
      })
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
        const geminiKey = process.env.GEMINI_API_KEY
        if (!geminiKey) throw new Error('GEMINI_API_KEY غير متوفر.')
        const ai = new GoogleGenAI({ apiKey: geminiKey })
        const resp = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{
            role: 'user',
            parts: [
              { text: 'اقرأ هذا الملف الصوتي وحول الكلام إلى نص مكتوب بالعربية. أعد فقط النص.' },
              { inlineData: { mimeType: 'audio/mp3', data: audio } },
            ],
          }],
        })
        const transcript = (resp as any)?.text || ''
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
      const finalPrompt = style ? `${prompt}\n\nالنمط الفني: ${style}` : prompt
      const geminiKey = process.env.GEMINI_API_KEY
      if (geminiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: geminiKey })
          const resp = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp-image-generation',
            contents: finalPrompt,
            config: { generationConfig: { responseModalities: ['Text', 'Image'] } } as any,
          })
          const parts = (resp as any)?.candidates?.[0]?.content?.parts || []
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/'))
              return res.json({ success: true, imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, provider: 'gemini' })
          }
        } catch (err: any) {
          console.error('[generate-image] Gemini error:', err?.message);
          throw new Error(`Gemini فشل في توليد الصورة: ${err?.message || 'خطأ غير معروف'}`);
        }
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

  // Temp Storage: Cleanup endpoint
  app.post('/api/temp/cleanup', async (_req, res) => {
    const removed = cleanupExpired()
    const stats = getStats()
    return res.json({ cleaned: removed, active: stats.total })
  })

  // Temp Storage: Stats endpoint
  app.get('/api/temp/stats', async (_req, res) => {
    return res.json(getStats())
  })

  // Run periodic cleanup every 10 minutes
  setInterval(() => {
    const removed = cleanupExpired()
    if (removed > 0) console.log(`[temp] Cleaned ${removed} expired temp files.`)
  }, 10 * 60 * 1000)

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
    // SPA fallback for dev mode: serve index.html for any unmatched GET request
    app.get('*', async (req, res) => {
      try {
        const htmlPath = path.join(process.cwd(), 'index.html');
        if (!fs.existsSync(htmlPath)) return res.status(404).send('index.html not found');
        const rawHtml = fs.readFileSync(htmlPath, 'utf-8');
        const html = await vite.transformIndexHtml(req.url, rawHtml);
        res.status(200).send(html);
      } catch (e: any) {
        res.status(500).send(`SPA fallback error: ${e.message}`);
      }
    })
  }

  app.listen(PORT, () => {
    console.log(`[AI Tools Hub Server] running on http://localhost:${PORT}`);
  });
}

startServer();
