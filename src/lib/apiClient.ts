const DEFAULT_TIMEOUT = 30000; // 30 seconds
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {}
      throw new ApiError(errorMessage, response.status);
    }

    const data = await response.json();
    return data.result || data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 408, 'TIMEOUT');
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error.message || 'Network error. Please check your connection.',
      0,
      'NETWORK_ERROR'
    );
  }
}

export async function apiPost<T>(endpoint: string, body: any, timeout?: number): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }, timeout);
}

export async function apiGet<T>(endpoint: string, timeout?: number): Promise<T> {
  return request<T>(endpoint, {
    method: 'GET',
  }, timeout);
}

// TODO Future Backend:
// - Add auth token injection
// - Add request retry logic
// - Add response caching
// - Support Supabase REST API directly
