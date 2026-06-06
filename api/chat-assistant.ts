import { GoogleGenAI } from "@google/genai";

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

function safeResponse(isArabic: boolean, overrides: Record<string, any> = {}) {
  return {
    explanation: isArabic
      ? 'حصلت مشكلة في تحليل رد المساعد، لكن أقدر أساعدك. جرّب صياغة طلبك بشكل أوضح.'
      : 'There was an issue processing the assistant response. Try rephrasing your request.',
    suggestedTools: [] as { toolId: string; reason: string }[],
    suggestedWorkflows: [] as { workflowId: string; reason: string }[],
    needCustomTool: false,
    ...overrides,
  };
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

  const ai = new GoogleGenAI({ apiKey });

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
      ? `أنت المساعد الذكي لمستخدمي منصة أدوات الذكاء الاصطناعي العربية. تواصل مع المستخدم باللغة العربية.`
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

    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash"
    ];

    let response: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: message,
          config: {
            systemInstruction,
            responseMimeType: "application/json"
          }
        });
        break;
      } catch (error: any) {
        lastError = error;
        const errorText = JSON.stringify(error);
        const isTemporary =
          errorText.includes("503") ||
          errorText.includes("UNAVAILABLE") ||
          errorText.includes("high demand");
        if (!isTemporary) {
          throw error;
        }
      }
    }

    if (!response) {
      console.error('[chat-assistant] All models exhausted, last error:', lastError?.message);
      return res.json(safeResponse(isArabic, {
        explanation: isArabic
          ? 'موديلات Gemini عليها ضغط مؤقت حاليًا. جرّب تاني بعد دقيقة.'
          : 'Gemini models are temporarily under high demand. Please try again later.'
      }));
    }

    // Clean and parse the response
    const rawText = response.text || '';
    const cleanedJson = cleanJsonResponse(rawText);

    if (!cleanedJson) {
      console.error('[chat-assistant] No JSON found in Gemini response:', rawText.slice(0, 300));
      return res.json(safeResponse(isArabic));
    }

    let result: any;
    try {
      result = JSON.parse(cleanedJson);
    } catch (parseError: any) {
      console.error('[chat-assistant] JSON parse failed:', parseError.message, '| cleaned:', cleanedJson.slice(0, 300));
      return res.json(safeResponse(isArabic));
    }

    // Normalize the result to always have the required fields
    return res.json({
      explanation: result.explanation || (isArabic ? 'تمت المعالجة!' : 'Processed!'),
      suggestedTools: Array.isArray(result.suggestedTools) ? result.suggestedTools : [],
      suggestedWorkflows: Array.isArray(result.suggestedWorkflows) ? result.suggestedWorkflows : [],
      needCustomTool: result.needCustomTool === true,
      ...(result.action === 'create' && result.newTool ? { createdTool: result.newTool } : {}),
      ...(result.action === 'match' && result.toolId ? { toolId: result.toolId } : {}),
    });
  } catch (error: any) {
    const errorText = String(error?.message || '');
    console.error('[chat-assistant] Unhandled error:', errorText.slice(0, 300));
    const isAuthError = errorText.includes('API_KEY') || errorText.includes('API key') || errorText.includes('not found');
    const isQuotaError = errorText.includes('quota') || errorText.includes('429') || errorText.includes('RATE_LIMIT');
    if (isAuthError) {
      return res.status(401).json({
        error: isArabic ? 'مشكلة في مفتاح API. تأكد من GEMINI_API_KEY.' : 'Invalid API key. Please check GEMINI_API_KEY.'
      });
    }
    if (isQuotaError) {
      return res.json(safeResponse(isArabic, {
        explanation: isArabic ? 'تم تجاوز حد الاستخدام. حاول بعد قليل.' : 'API quota exceeded. Please try again later.'
      }));
    }
    return res.json(safeResponse(isArabic));
  }
}
