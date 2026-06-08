export async function generateAIContent(prompt: string, imageBase64?: string, imageMimeType?: string): Promise<string> {
  try {
    const body: Record<string, any> = { prompt };
    if (imageBase64) body.imageBase64 = imageBase64;
    if (imageMimeType) body.imageMimeType = imageMimeType;

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `خطأ من الخادم (رموز الحالة ${response.status})`);
    }

    return data.result || '';
  } catch (error: any) {
    console.error('Core AI Service Error:', error);
    throw new Error(error.message || 'تعذر الاتصال بخدمة الذكاء الاصطناعي حاليًا. حاول مرة أخرى لاحقًا.');
  }
}
