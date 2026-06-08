export async function generateAIContent(prompt: string, imageBase64?: string, imageMimeType?: string): Promise<string> {
  try {
    const body: Record<string, any> = { prompt };
    if (imageBase64) body.imageBase64 = imageBase64;
    if (imageMimeType) body.imageMimeType = imageMimeType;

    console.log("=== aiService: Sending request ===");
    console.log("Body keys:", Object.keys(body));
    console.log("imageBase64 present:", !!body.imageBase64);
    console.log("imageBase64 length:", body.imageBase64?.length);
    console.log("Full body size (approx):", JSON.stringify(body).length, "bytes");

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    let data: any;
    try { data = JSON.parse(text); } catch {
      if (text.startsWith('An error') || text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        throw new Error(`الخادم أعاد استجابة غير متوقعة (حالة ${response.status}). تأكد من تشغيل خادم Express: \`pnpm dev:server\``);
      }
      throw new Error(`استجابة غير صالحة من الخادم: ${text.slice(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `خطأ من الخادم (رموز الحالة ${response.status})`);
    }

    return data.result || '';
  } catch (error: any) {
    console.error('Core AI Service Error:', error);
    throw new Error(error.message || 'تعذر الاتصال بخدمة الذكاء الاصطناعي حاليًا. حاول مرة أخرى لاحقًا.');
  }
}
