import { readStorage, writeStorage } from "./storage"

export async function apiRequest<T>(
  path: string,
  fallback: T,
  init?: RequestInit,
): Promise<T> {
  const cacheKey = `career-guide:${path}`
  const token = readStorage<string | null>("career-guide:token", null)
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  try {
    const response = await fetch(`/api${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...init?.headers,
      },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = (await response.json()) as T
    writeStorage(cacheKey, data)
    return data
  } catch {
    const cached = readStorage<T | null>(cacheKey, null)
    if (cached) return cached
    writeStorage(cacheKey, fallback)
    return fallback
  }
}
