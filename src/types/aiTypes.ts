export type TaskType = 'text' | 'image' | 'audio' | 'video' | 'search' | 'file'
export type ApiProvider = 'gemini' | 'openrouter' | 'openai' | 'stability' | 'whisper' | 'serp'

export interface ApiKeyConfig {
  provider: ApiProvider
  key: string
  enabled: boolean
  priority: number
  model?: string
}

export interface AiRouterRequest {
  taskType: TaskType
  prompt?: string
  file?: File | string
  fileName?: string
  mimeType?: string
  model?: string
  style?: string
  language?: string
}

export interface AiRouterResponse {
  success: boolean
  result?: string
  imageUrl?: string
  audioUrl?: string
  error?: string
  providerUsed?: ApiProvider
  modelUsed?: string
  processingTime?: number
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  createdAt: string
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface SearchResponse {
  success: boolean
  summary: string
  results: SearchResult[]
  error?: string
}

export interface AudioTranscript {
  text: string
  segments?: { start: number; end: number; text: string }[]
  language?: string
  duration?: number
}
