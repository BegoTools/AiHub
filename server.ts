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
      const { message, existingTools, customKey, language } = req.body;
      const userLang = language || 'ar';

      if (!message) {
        return res.status(400).json({ error: 'حقل الرسالة فارغ.' });
      }

      const apiKey = customKey || process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        return res.status(401).json({ error: 'مفتاح Gemini API غير متوفر.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const formattedTools = Array.isArray(existingTools) 
        ? existingTools.slice(0, 50).map(t => ({ id: t.id, title: t.title, description: t.description }))
        : [];

      const systemInstruction = `
        You are an AI assistant for "Arabic AI Tools Hub". 
        Language Preference: ${userLang}. 
        Current Tools: ${JSON.stringify(formattedTools)}
        
        Task: 
        1. If request matches an existing tool, return JSON: {"action": "match", "explanation": "...", "toolId": "..."}
        2. If no match, create a new tool JSON: {"action": "create", "explanation": "...", "newTool": {...}}
        
        New Tool Schema: {id, categoryId, title, description, icon, inputs: [{id, label, type, placeholder, options, defaultValue}], exampleInput, promptTemplateString}
        Return clean JSON only.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: message,
        config: {
          systemInstruction
        }
      });
      let text = (response.text || "").trim();
      
      // Clean markdown
      if (text.startsWith('```json')) text = text.replace(/```json|```/g, '').trim();
      else if (text.startsWith('```')) text = text.replace(/```/g, '').trim();

      return res.json(JSON.parse(text));
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
