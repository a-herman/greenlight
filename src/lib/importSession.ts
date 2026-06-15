import type { ParsedFile } from './policyParser/types'

interface StoredSession {
  data: ParsedFile
  expiresAt: number
}

declare global {
  // eslint-disable-next-line no-var
  var __importSessions: Map<string, StoredSession> | undefined
}

const SESSION_TTL_MS = 30 * 60 * 1000 // 30 minutes

function getStore(): Map<string, StoredSession> {
  if (!globalThis.__importSessions) globalThis.__importSessions = new Map()
  return globalThis.__importSessions
}

function purgeExpired(store: Map<string, StoredSession>) {
  const now = Date.now()
  for (const [key, val] of store) {
    if (val.expiresAt < now) store.delete(key)
  }
}

export function storeSession(id: string, data: ParsedFile): void {
  const store = getStore()
  purgeExpired(store)
  store.set(id, { data, expiresAt: Date.now() + SESSION_TTL_MS })
}

export function getSession(id: string): ParsedFile | null {
  const store = getStore()
  const entry = store.get(id)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    store.delete(id)
    return null
  }
  return entry.data
}

export function deleteSession(id: string): void {
  getStore().delete(id)
}
