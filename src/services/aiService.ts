import { ApiSettings } from '../types';
import { LOCAL_STORAGE_KEYS } from '../config/apiConfig';

/**
 * AI Generation Service
 * Calls the secure server proxy `/api/generate` with appropriate configurations
 */
export async function generateAIContent(
  prompt: string,
  settings: ApiSettings
): Promise<string> {
  try {
    const payload: {
      prompt: string;
      provider: 'gemini' | 'openrouter';
      model?: string;
      customKey?: string;
    } = {
      prompt,
      provider: settings.provider,
      model: settings.selectedModel
    };

    // If the user has "useCustomKeys" enabled or has custom keys, pass them
    if (settings.useCustomKeys) {
      if (settings.provider === 'gemini' && settings.geminiKey) {
        payload.customKey = settings.geminiKey;
      } else if (settings.provider === 'openrouter' && settings.openRouterKey) {
        payload.customKey = settings.openRouterKey;
      }
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `خطأ من الخادم (رموز الحالة ${response.status})`);
    }

    return data.result || '';
  } catch (error: any) {
    console.error('Core AI Service Error:', error);
    throw new Error(error.message || 'فشل الاتصال بذكاء الحساب، يرجى التثبت من إعدادات الاتصال الخاصة بك.');
  }
}
