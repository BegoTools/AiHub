interface TempFile {
  id: string
  name: string
  size: number
  type: string
  category: string
  data: string
  createdAt: number
  ttl: number
}

const store = new Map<string, TempFile>()
const DEFAULT_TTL = 30 * 60 * 1000
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function generateId(): string {
  const buf = new Uint32Array(4)
  crypto.getRandomValues(buf)
  return `tmp_${Array.from(buf).map(b => b.toString(36)).join('')}`
}

export function registerFile(
  name: string,
  size: number,
  type: string,
  category: string,
  data: string,
  ttl: number = DEFAULT_TTL,
): TempFile {
  const id = generateId()
  const file: TempFile = { id, name, size, type, category, data, createdAt: Date.now(), ttl }
  store.set(id, file)
  startCleanup()
  return file
}

export function getFile(id: string): TempFile | undefined {
  const file = store.get(id)
  if (!file) return undefined
  if (Date.now() - file.createdAt > file.ttl) {
    store.delete(id)
    return undefined
  }
  return file
}

export function deleteFile(id: string): boolean {
  return store.delete(id)
}

export function cleanupExpired(): number {
  const now = Date.now()
  let count = 0
  for (const [id, file] of store.entries()) {
    if (now - file.createdAt > file.ttl) {
      store.delete(id)
      count++
    }
  }
  return count
}

export function clearAll(): number {
  const count = store.size
  store.clear()
  return count
}

export function getStats(): { total: number; expired: number } {
  const now = Date.now()
  let expired = 0
  for (const file of store.values()) {
    if (now - file.createdAt > file.ttl) expired++
  }
  return { total: store.size, expired }
}

function startCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const removed = cleanupExpired()
    if (removed > 0) {
      console.log(`[temp-storage] Cleaned ${removed} expired file(s). Active: ${store.size}`)
    }
    if (store.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer)
      cleanupTimer = null
    }
  }, 5 * 60 * 1000)
}

if (typeof process !== 'undefined' && process.on) {
  process.on('exit', () => { if (cleanupTimer) clearInterval(cleanupTimer) })
  process.on('SIGINT', () => { clearAll(); if (cleanupTimer) clearInterval(cleanupTimer); process.exit(0) })
}
