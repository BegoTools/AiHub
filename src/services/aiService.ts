export async function generateAIContent(prompt: string): Promise<string> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
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
