type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

export function setCache<T>(key: string, value: T, ttlMs = 60000) {
  const expiresAt = Date.now() + ttlMs
  cache.set(key, { value, expiresAt })
}

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.value
}

export function clearCache(key?: string) {
  if (key) cache.delete(key)
  else cache.clear()
}

export function clearCachePrefix(prefix: string) {
  for (const k of Array.from(cache.keys())) {
    if (k.startsWith(prefix)) cache.delete(k)
  }
}
