import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Route: Generate AI Content
  app.post('/api/generate', async (req, res) => {
    try {
      const { prompt, provider, model, customKey } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'حقل النص المطلوب (prompt) فارغ.' });
      }

      const selectedProvider = provider || 'gemini';
      
      if (selectedProvider === 'gemini') {
        const apiKey = customKey || process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.trim() === '') {
          return res.status(401).json({ error: 'مفتاح Gemini API غير متوفر.' });
        }

        const ai = new GoogleGenAI({ apiKey });
        const chosenModel = model || 'gemini-2.0-flash';
        const response = await ai.models.generateContent({
          model: chosenModel,
          contents: prompt
        });
        return res.json({ result: response.text });
      } 
      
      else if (selectedProvider === 'openrouter') {
        const apiKey = customKey || process.env.OPENROUTER_API_KEY;
        if (!apiKey || apiKey.trim() === '') {
          return res.status(401).json({ error: 'مفتاح OpenRouter API غير متوفر.' });
        }

        const chosenModel = model || 'google/gemini-2.5-flash:free';
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://ais-dev.europe-west2.run.app',
            'X-Title': 'AI Tools Hub Arabic'
          },
          body: JSON.stringify({
            model: chosenModel,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return res.json({ result: data.choices?.[0]?.message?.content || '' });
      }

      return res.status(400).json({ error: 'المزود المختار غير متاح حالياً.' });
    } catch (err: any) {
      console.error('Server General Error:', err);
      return res.status(500).json({ error: `حدث خطأ داخلي: ${err.message || 'خطأ غير معروف'}` });
    }
  });

  // API Route: AI Chat Assistant
  app.post('/api/chat-assistant', async (req, res) => {
    try {
      const { message, existingTools, existingWorkflows, customKey, language } = req.body;
      const isArabic = language === 'ar';

      if (!message) {
        return res.status(400).json({ error: isArabic ? 'حقل الرسالة فارغ.' : 'Message is empty.' });
      }

      const apiKey = customKey || process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        return res.status(401).json({ error: isArabic ? 'مفتاح Gemini API غير متوفر.' : 'Gemini API key not available.' });
      }

      const ai = new GoogleGenAI({ apiKey });

      const formattedTools = Array.isArray(existingTools)
        ? existingTools.slice(0, 50).map((t: any) => ({ id: t.id, title: t.title, description: t.description, category: t.categoryId || '' }))
        : [];

      const formattedWorkflows = Array.isArray(existingWorkflows)
        ? existingWorkflows.slice(0, 20).map((wf: any) => ({ id: wf.id, title: wf.title, description: wf.description, category: wf.category || '' }))
        : [];

      const langInstruction = isArabic
        ? 'أنت المساعد الذكي لمستخدمي منصة أدوات الذكاء الاصطناعي العربية. تواصل مع المستخدم باللغة العربية.'
        : `You are the AI assistant for the AI Tools Hub platform. Communicate with the user in ${language === 'en' ? 'English' : language === 'de' ? 'German' : language === 'fr' ? 'French' : language === 'it' ? 'Italian' : 'English'}.`;

      const systemInstruction = `
${langInstruction}

Your task:
- Understand the user's request.
- If a suitable tool exists in existingTools, return JSON with action = "chat".
- Include suggested tools and workflows in your response.
- If no tool exists and the user needs a custom one, set needCustomTool: true.

Available tools:
${JSON.stringify(formattedTools)}

Available workflows:
${JSON.stringify(formattedWorkflows)}

Return clean JSON only, no markdown.

Response format:
{
  "action": "chat",
  "explanation": "${isArabic ? 'شرح قصير للمستخدم' : 'Short explanation for the user'}",
  "suggestedTools": [{ "toolId": "tool_id", "reason": "why this tool" }],
  "suggestedWorkflows": [{ "workflowId": "wf_id", "reason": "why this workflow" }],
  "needCustomTool": false
}
`;

      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];

      let response: any = null;
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: message,
            config: { systemInstruction, responseMimeType: 'application/json' }
          });
          break;
        } catch (error: any) {
          lastError = error;
          const errorText = JSON.stringify(error);
          const isTemporary =
            errorText.includes('503') || errorText.includes('UNAVAILABLE') || errorText.includes('high demand');
          if (!isTemporary) throw error;
        }
      }

      if (!response) {
        throw new Error(isArabic ? 'موديلات Gemini عليها ضغط مؤقت حاليًا. جرّب تاني بعد دقيقة.' : 'Gemini models are temporarily under high demand. Please try again later.');
      }

      let text = (response.text || '').trim();
      if (text.startsWith('```')) {
        text = text.split('\n').filter((line: string) => !line.trim().startsWith('```')).join('\n').trim();
      }

      const result = JSON.parse(text);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('Chat Assistant Error:', err);
      return res.status(500).json({ error: `فشل المساعد: ${err.message}` });
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
