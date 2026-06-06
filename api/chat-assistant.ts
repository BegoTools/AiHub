import { GoogleGenAI } from "@google/genai";

const GEMINI_FALLBACK: string[] = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
];

const TIMEOUT_MS = 60000;

function cleanJsonResponse(raw: string): string {
  if (!raw) return '';
  let text = raw.trim();
  // Remove markdown code fences (```json, ```, etc.)
  text = text.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
  // Extract only the JSON object: first { to last }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return '';
  return text.slice(start, end + 1);
}

function safeParseJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function safeResponse(isArabic: boolean, overrides: Record<string, any> = {}) {
  return {
    action: 'chat',
    explanation: isArabic
      ? 'حصلت مشكلة مؤقتة في تحليل رد المساعد، لكن أقدر أساعدك. جرّب تكتب طلبك بشكل أوضح.'
      : 'There was a temporary issue processing the response. Please try rephrasing your request.',
    suggestedTools: [] as { toolId: string; reason: string }[],
    suggestedWorkflows: [] as { workflowId: string; reason: string }[],
    needCustomTool: false,
    ...overrides,
  };
}

function buildFinalResponse(result: any, isArabic: boolean) {
  const response: Record<string, any> = {
    action: 'chat',
    explanation: result.explanation || (isArabic ? 'تمت المعالجة!' : 'Processed!'),
    suggestedTools: Array.isArray(result.suggestedTools) ? result.suggestedTools : [],
    suggestedWorkflows: Array.isArray(result.suggestedWorkflows) ? result.suggestedWorkflows : [],
    needCustomTool: result.needCustomTool === true,
  };
  if (result.createdTool || result.newTool) {
    response.createdTool = result.createdTool || result.newTool;
  }
  if (result.toolId) {
    response.toolId = result.toolId;
  }
  return response;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { message, existingTools, existingWorkflows, customKey, language } = body || {};
  const isArabic = language === 'ar';

  if (!message) {
    return res.status(400).json({
      error: isArabic ? "حقل الرسالة message فارغ." : "Message field is empty."
    });
  }

  const apiKey = customKey || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return res.status(401).json({
      error: isArabic ? "GEMINI_API_KEY مش متضاف في Vercel." : "GEMINI_API_KEY not set in Vercel."
    });
  }

  const formattedTools = Array.isArray(existingTools)
    ? existingTools.slice(0, 50).map((tool: any) => ({
        id: tool.id,
        title: tool.title,
        description: tool.description,
        category: tool.categoryId || '',
      }))
    : [];

  const formattedWorkflows = Array.isArray(existingWorkflows)
    ? existingWorkflows.slice(0, 20).map((wf: any) => ({
        id: wf.id,
        title: wf.title,
        description: wf.description,
        category: wf.category || '',
      }))
    : [];

  try {
    const langInstruction = isArabic
      ? 'أنت المساعد الذكي لمستخدمي منصة أدوات الذكاء الاصطناعي العربية. تواصل مع المستخدم باللغة العربية.'
      : `You are the AI assistant for the AI Tools Hub platform. Communicate with the user in ${language === 'en' ? 'English' : language === 'de' ? 'German' : language === 'fr' ? 'French' : language === 'it' ? 'Italian' : 'English'}.`;

    const matchExplanation = isArabic ? 'شرح قصير للمستخدم' : 'Short explanation for the user';

    const systemInstruction = `
${langInstruction}

Your task:
- Understand the user's request.
- If a suitable tool exists in existingTools, include it in suggestedTools with its toolId.
- If no suitable tool exists, set needCustomTool: true and provide a full newTool definition.
- Always include suggestedTools and suggestedWorkflows.

Available tools:
${JSON.stringify(formattedTools)}

Available workflows:
${JSON.stringify(formattedWorkflows)}

Return clean JSON only, no markdown.

Response format:
{
  "action": "chat",
  "explanation": "${matchExplanation}",
  "suggestedTools": [{ "toolId": "id", "reason": "why this tool" }],
  "suggestedWorkflows": [{ "workflowId": "id", "reason": "why this workflow" }],
  "needCustomTool": false,
  "newTool": {
    "id": "unique_id",
    "categoryId": "general",
    "title": "Tool title",
    "description": "Tool description",
    "icon": "Sparkles",
    "inputs": [{ "id": "topic", "label": "Topic", "type": "textarea", "placeholder": "Enter your request here" }],
    "exampleInput": { "topic": "Example" },
    "promptTemplateString": "Execute professionally: {topic}"
  },
  "toolId": "study_summarizer"
}
`;

    let lastError: any = null;
    let response: any = null;

    for (const modelName of GEMINI_FALLBACK) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        response = await Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: message,
            config: { systemInstruction, responseMimeType: 'application/json' },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
          ),
        ]);
        break;
      } catch (error: any) {
        lastError = error;
        const text = JSON.stringify(error).toLowerCase();
        const isTransient =
          text.includes('503') ||
          text.includes('unavailable') ||
          text.includes('overloaded') ||
          text.includes('high demand') ||
          text.includes('resource has been exhausted') ||
          text.includes('quota') ||
          text.includes('timeout');
        if (!isTransient) {
          console.error('[chat-assistant] Non-retryable error:', error?.message);
          return res.json(safeResponse(isArabic));
        }
      }
    }

    if (!response) {
      console.error('[chat-assistant] All models exhausted:', lastError?.message);
      return res.json(safeResponse(isArabic, {
        explanation: isArabic
          ? 'خدمة Gemini مش متاحة مؤقتًا. جرّب تاني بعد شوية.'
          : 'Gemini service is temporarily unavailable. Please try again later.'
      }));
    }

    const rawText = response.text || '';
    const cleanedJson = cleanJsonResponse(rawText);

    if (!cleanedJson) {
      console.error('[chat-assistant] No JSON in Gemini response:', rawText.slice(0, 300));
      return res.json(safeResponse(isArabic));
    }

    const result = safeParseJson(cleanedJson);

    if (!result) {
      console.error('[chat-assistant] JSON parse failed on:', cleanedJson.slice(0, 300));
      return res.json(safeResponse(isArabic));
    }

    return res.json(buildFinalResponse(result, isArabic));

  } catch (error: any) {
    const msg = String(error?.message || '');
    console.error('[chat-assistant] Unhandled error:', msg.slice(0, 300));
    const isAuth = msg.includes('API_KEY') || msg.includes('API key') || msg.includes('not found');
    if (isAuth) {
      return res.status(401).json({
        error: isArabic ? 'مشكلة في مفتاح API. راجع إعدادات GEMINI_API_KEY.' : 'Invalid API key. Check GEMINI_API_KEY.'
      });
    }
    return res.json(safeResponse(isArabic));
  }
}
