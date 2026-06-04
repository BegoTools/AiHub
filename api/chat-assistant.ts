import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { message, existingTools, customKey, language } = body || {};
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
        description: tool.description
      }))
    : [];

  try {
    const langInstruction = isArabic
      ? `أنت المساعد الذكي لمستخدمي منصة أدوات الذكاء الاصطناعي العربية. تواصل مع المستخدم باللغة العربية.`
      : `You are the AI assistant for the AI Tools Hub platform. Communicate with the user in ${language === 'en' ? 'English' : language === 'de' ? 'German' : language === 'fr' ? 'French' : language === 'it' ? 'Italian' : 'English'}.`;

    const matchTitle = isArabic ? 'عنوان الأداة بالعربي' : 'Tool title';
    const matchDesc = isArabic ? 'وصف الأداة' : 'Tool description';
    const matchTopic = isArabic ? 'الموضوع' : 'Topic';
    const matchPlaceholder = isArabic ? 'اكتب المطلوب هنا' : 'Enter your request here';
    const matchExample = isArabic ? 'مثال عملي' : 'Practical example';
    const matchPrompt = isArabic ? 'نفذ الطلب التالي باحتراف: {topic}' : 'Execute the following request professionally: {topic}';
    const matchExplanation = isArabic ? 'شرح قصير للمستخدم' : 'Short explanation for the user';

    const systemInstruction = `
${langInstruction}

Your task:
- Understand the user's request.
- If a suitable tool exists in existingTools, return JSON with action = "match".
- If no suitable tool exists, design a new tool and return JSON with action = "create".

Available tools:
${JSON.stringify(formattedTools)}

Return clean JSON only, no markdown.

Match format:
{
  "action": "match",
  "explanation": "${matchExplanation}",
  "toolId": "id of the matched tool"
}

Create format:
{
  "action": "create",
  "explanation": "${matchExplanation}",
  "newTool": {
    "id": "unique_tool_id",
    "categoryId": "study",
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
      throw new Error(
        isArabic
          ? "موديلات Gemini عليها ضغط مؤقت حاليًا. جرّب تاني بعد دقيقة."
          : "Gemini models are temporarily under high demand. Please try again later."
      );
    }

    let text = response.text || "";
    text = text.trim();

    if (text.startsWith("```")) {
      text = text
        .split("\n")
        .filter((line) => !line.trim().startsWith("```"))
        .join("\n")
        .trim();
    }

    const result = JSON.parse(text);

    return res.status(200).json(result);
  } catch (error: any) {
    const errorMsg = isArabic
      ? (error.message || "فشل مساعد الذكاء الاصطناعي.")
      : (error.message || "AI Assistant failed.");
    return res.status(500).json({ error: errorMsg });
  }
}
