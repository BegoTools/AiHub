const GEMINI_KEY = 'aihub_gemini_api_key';
const OPENROUTER_KEY = 'aihub_openrouter_api_key';

export function getGeminiKey(): string {
  try { return localStorage.getItem(GEMINI_KEY) || ''; } catch { return ''; }
}

export function setGeminiKey(key: string): void {
  try { localStorage.setItem(GEMINI_KEY, key); } catch {}
}

export function getOpenRouterKey(): string {
  try { return localStorage.getItem(OPENROUTER_KEY) || ''; } catch { return ''; }
}

export function setOpenRouterKey(key: string): void {
  try { localStorage.setItem(OPENROUTER_KEY, key); } catch {}
}

export function hasAnyKey(): boolean {
  return !!(getGeminiKey() || getOpenRouterKey());
}
