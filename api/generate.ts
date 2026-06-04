import { GoogleGenAI } from "@google/genai";

function getErrorMessage(error: any) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown server error";
  }
}

async function generateWithGemini(apiKey: string, modelName: string, prompt: string) {
  const ai = new GoogleGenAI({ apiKey });
  
  return await Promise.race([
    ai.models.generateContent({
      model: modelName,
      contents: prompt
    }),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("انتهت مهلة الاتصال بـ Gemini، جرّب مرة أخرى.")),
        20000
      )
    )
  ]);
}

async function generateWithOpenRouter(apiKey: string, modelName: string, prompt: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://ais-dev.europe-west2.run.app',
      'X-Title': 'AI Tools Hub Arabic'
    },
    body: JSON.stringify({
      model: modelName || 'google/gemini-2.5-flash:free',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return { text: data.choices?.[0]?.message?.content || '' };
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
    const selectedModel = model || (selectedProvider === 'gemini' ? 'gemini-2.0-flash' : 'google/gemini-2.5-flash:free');

    if (selectedProvider === 'gemini') {
      const apiKey = customKey || process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        return res.status(401).json({ error: "مفتاح Gemini API غير متوفر." });
      }

      const response: any = await generateWithGemini(apiKey, selectedModel, prompt);
      const resultText = response.text || "";
      
      return res.status(200).json({ result: resultText });
    } 
    
    else if (selectedProvider === 'openrouter') {
      const apiKey = customKey || process.env.OPENROUTER_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        return res.status(401).json({ error: "مفتاح OpenRouter API غير متوفر." });
      }

      const response = await generateWithOpenRouter(apiKey, selectedModel, prompt);
      return res.status(200).json({ result: response.text });
    }

    return res.status(400).json({ error: "المزود المختار غير مدعوم حالياً." });

  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
