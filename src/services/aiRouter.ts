import type { AiRouterRequest, AiRouterResponse, TaskType } from '../types/aiTypes'

const API_BASE = '/api'

async function postJSON<T>(url: string, body: any, timeoutMs = 60000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data
  } finally {
    clearTimeout(timer)
  }
}

function classifyTask(req: AiRouterRequest): TaskType {
  if (req.file) {
    const mime = req.mimeType || ''
    if (mime.startsWith('audio/')) return 'audio'
    if (mime.startsWith('image/')) return 'image'
    if (mime === 'application/pdf') return 'file'
    if (mime.startsWith('video/')) return 'video'
  }
  if (req.taskType) return req.taskType
  return 'text'
}

export async function routeRequest(req: AiRouterRequest): Promise<AiRouterResponse> {
  const startTime = Date.now()
  const taskType = classifyTask(req)

  try {
    switch (taskType) {
      case 'text': {
        const data = await postJSON<{ result: string; provider: string; model: string }>(`${API_BASE}/generate`, {
          prompt: req.prompt,
          model: req.model,
        })
        return { success: true, result: data.result, providerUsed: data.provider as any, modelUsed: data.model, processingTime: Date.now() - startTime }
      }

      case 'audio': {
        const data = await postJSON<{ success: boolean; transcript: string; summary?: string }>(`${API_BASE}/audio`, {
          audio: req.file,
          fileName: req.fileName,
          action: 'transcribe',
        }, 120000)
        let result = data.transcript
        if (data.summary) result = `📝 **النص المستخرج**:\n${data.transcript}\n\n📋 **الملخص**:\n${data.summary}`
        return { success: true, result, providerUsed: 'gemini', processingTime: Date.now() - startTime }
      }

      case 'image': {
        const data = await postJSON<{ success: boolean; imageUrl: string; provider: string }>(`${API_BASE}/generate-image`, {
          prompt: req.prompt,
          style: req.style,
        })
        return { success: true, imageUrl: data.imageUrl, result: data.imageUrl, providerUsed: data.provider as any, processingTime: Date.now() - startTime }
      }

      case 'search': {
        const data = await postJSON<{ success: boolean; summary: string; results: any[] }>(`${API_BASE}/search`, {
          query: req.prompt,
        })
        return { success: true, result: data.summary, providerUsed: 'gemini', processingTime: Date.now() - startTime }
      }

      case 'file': {
        const fileData = await postJSON<{ success: boolean; data: { base64: string; name: string; type: string; category: string } }>(`${API_BASE}/upload`, {
          file: req.file,
          fileName: req.fileName,
          fileType: req.mimeType,
          fileSize: typeof req.file === 'string' ? req.file.length : 0,
        })
        const textResult = await postJSON<{ result: string }>(`${API_BASE}/generate`, {
          prompt: `حلل الملف التالي (نوع: ${fileData.data.type}) واستخرج منه المعلومات المفيدة:\n\nالبيانات متوفرة كـ base64. قم بتحليل اسم الملف: ${fileData.data.name}`,
        })
        return { success: true, result: `📁 **الملف**: ${fileData.data.name}\n**النوع**: ${fileData.data.category}\n\n🔍 **التحليل**:\n${textResult.result}`, providerUsed: 'gemini', processingTime: Date.now() - startTime }
      }

      default: {
        const data = await postJSON<{ result: string }>(`${API_BASE}/generate`, { prompt: req.prompt })
        return { success: true, result: data.result, processingTime: Date.now() - startTime }
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'تعذر الاتصال بالخدمة. حاول مرة أخرى لاحقًا.',
      processingTime: Date.now() - startTime,
    }
  }
}
