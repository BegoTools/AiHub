export function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (json === null || json === undefined || json === '') return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function ensureArray<T>(data: unknown, fallback: T[] = []): T[] {
  return Array.isArray(data) ? data : fallback;
}
