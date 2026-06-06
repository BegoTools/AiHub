import { GoogleGenAI } from "@google/genai";

const GEMINI_FALLBACK: string[] = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
];

const TIMEOUT_MS = 60000;

function isTransientError(error: any): boolean {
  const text = JSON.stringify(error).toLowerCase();
  return (
    text.includes('503') ||
    text.includes('unavailable') ||
    text.includes('overloaded') ||
    text.includes('high demand') ||
    text.includes('resource has been exhausted') ||
    text.includes('quota') ||
    text.includes('timeout')
  );
}

async function generateWithGemini(apiKey: string, model: string, prompt: string) {
  const ai = new GoogleGenAI({ apiKey });
  return await Promise.race([
    ai.models.generateContent({ model, contents: prompt }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
    ),
  ]);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { prompt, provider, model, customKey } = body;

    if (!prompt || String(prompt).trim() === "") {
      return res.status(400).json({ error: "حقل النص المطلوب فارغ." });
    }

    const selectedProvider = provider || 'gemini';

    if (selectedProvider === 'gemini') {
      const apiKey = customKey || process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        return res.status(401).json({ error: "مفتاح Gemini API غير متوفر." });
      }

      // Build model list: user's custom model first, then standard fallbacks
      const modelsToTry = model
        ? [model, ...GEMINI_FALLBACK.filter(m => m !== model)]
        : GEMINI_FALLBACK;

      let lastError: any = null;

      for (const m of modelsToTry) {
        try {
          const response: any = await generateWithGemini(apiKey, m, prompt);
          return res.status(200).json({ result: response.text || '' });
        } catch (error: any) {
          lastError = error;
          if (!isTransientError(error)) {
            throw error;
          }
        }
      }

      console.error('[generate] All Gemini models exhausted:', lastError?.message);
      return res.status(503).json({
        error: 'تعذر الاتصال بـ Gemini حاليًا. جرّب مرة أخرى أو استخدم مفتاح API آخر.'
      });
    }

    if (selectedProvider === 'openrouter') {
      const apiKey = customKey || process.env.OPENROUTER_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        return res.status(401).json({ error: "مفتاح OpenRouter API غير متوفر." });
      }

      const selectedModel = model || 'google/gemini-2.5-flash:free';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://ais-dev.europe-west2.run.app',
            'X-Title': 'AI Tools Hub Arabic',
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: prompt }],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json({ result: data.choices?.[0]?.message?.content || '' });
      } finally {
        clearTimeout(timeoutId);
      }
    }

    return res.status(400).json({ error: "المزود المختار غير مدعوم حالياً." });

  } catch (error: any) {
    console.error('[generate] Fatal error:', error?.message || error);
    return res.status(503).json({
      error: 'تعذر الاتصال بـ Gemini حاليًا. جرّب مرة أخرى أو استخدم مفتاح API آخر.'
    });
  }
}
