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
    const { message, existingTools, existingWorkflows, customKey, language } = req.body || {};
    const isArabic = language === 'ar';
    try {

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

      const matchExplanation = isArabic ? 'شرح قصير للمستخدم' : 'Short explanation for the user';
      const matchTitle = isArabic ? 'عنوان الأداة بالعربي' : 'Tool title';
      const matchDesc = isArabic ? 'وصف الأداة' : 'Tool description';
      const matchTopic = isArabic ? 'الموضوع' : 'Topic';
      const matchPlaceholder = isArabic ? 'اكتب المطلوب هنا' : 'Enter your request here';
      const matchExample = isArabic ? 'مثال عملي' : 'Practical example';
      const matchPrompt = isArabic ? 'نفذ الطلب التالي باحتراف: {topic}' : 'Execute the following request professionally: {topic}';

      const systemInstruction = `
${langInstruction}

Your task:
- Understand the user's request.
- If a suitable tool exists in existingTools, return JSON with action = "match" and include toolId of the best matching tool.
- If no suitable tool exists, design a new custom tool and return JSON with action = "create" with a full newTool definition.
- Always include suggestedTools and suggestedWorkflows in the response.

Available tools:
${JSON.stringify(formattedTools)}

Available workflows:
${JSON.stringify(formattedWorkflows)}

Return clean JSON only, no markdown.

--- Use this format when an existing tool fits the request ---
{
  "action": "match",
  "explanation": "${matchExplanation}",
  "toolId": "study_summarizer",
  "suggestedTools": [{ "toolId": "study_summarizer", "reason": "why this tool" }],
  "suggestedWorkflows": [],
  "needCustomTool": false
}

--- Use this format when NO existing tool fits ---
{
  "action": "create",
  "explanation": "${matchExplanation}",
  "suggestedTools": [],
  "suggestedWorkflows": [],
  "needCustomTool": true,
  "newTool": {
    "id": "custom_ai_generated_tool",
    "categoryId": "general",
    "title": "${matchTitle}",
    "description": "${matchDesc}",
    "icon": "Sparkles",
    "inputs": [
      {
        "id": "topic",
        "label": "${matchTopic}",
        "type": "textarea",
        "placeholder": "${matchPlaceholder}"
      }
    ],
    "exampleInput": {
      "topic": "${matchExample}"
    },
    "promptTemplateString": "${matchPrompt}"
  }
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
      const errorText = String(err?.message || '');
      const isParseError = typeof err === 'object' && err !== null && err.name === 'SyntaxError' && errorText.includes('JSON');
      const isAuthError = errorText.includes('API_KEY') || errorText.includes('API key') || errorText.includes('not found');
      const isQuotaError = errorText.includes('quota') || errorText.includes('429') || errorText.includes('RATE_LIMIT');
      const errorMsg = isParseError
        ? (isArabic ? 'لم يتم فهم رد Gemini. حاول مرة أخرى.' : 'Gemini response was not valid JSON. Please try again.')
        : isAuthError
          ? (isArabic ? 'مشكلة في مفتاح API. تأكد من GEMINI_API_KEY.' : 'Invalid API key. Please check GEMINI_API_KEY.')
          : isQuotaError
            ? (isArabic ? 'تم تجاوز حد الاستخدام. حاول بعد قليل.' : 'API quota exceeded. Please try again later.')
            : `فشل المساعد: ${err.message}`;
      return res.status(500).json({ error: errorMsg });
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
