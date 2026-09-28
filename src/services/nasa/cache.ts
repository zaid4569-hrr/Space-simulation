const CACHE_VERSION = 1
const CACHE_PREFIX = `orbital-command:nasa:v${CACHE_VERSION}:`
const ALLOWED_CLOCK_SKEW_MS = 5 * 60 * 1_000

interface CacheEntry<T> {
  version: number
  savedAt: number
  value: T
}

const memoryCache = new Map<string, CacheEntry<unknown>>()

export interface CacheResult<T> {
  value: T
  fresh: boolean
  savedAt: number
}

export function readCache<T>(key: string, ttlMs: number, isExpected: (value: unknown) => value is T): CacheResult<T> | null {
  const fullKey = `${CACHE_PREFIX}${key}`
  const memoryEntry = memoryCache.get(fullKey)
  let entry = memoryEntry && isExpected(memoryEntry.value) ? memoryEntry as CacheEntry<T> : undefined

  if (!entry) {
    try {
      const raw = localStorage.getItem(fullKey)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (
          typeof parsed === 'object' && parsed !== null &&
          'version' in parsed && parsed.version === CACHE_VERSION &&
          'savedAt' in parsed && typeof parsed.savedAt === 'number' && Number.isFinite(parsed.savedAt)
          && parsed.savedAt > 0 && parsed.savedAt <= Date.now() + ALLOWED_CLOCK_SKEW_MS &&
          'value' in parsed && isExpected(parsed.value)
        ) {
          entry = parsed as CacheEntry<T>
          memoryCache.set(fullKey, entry)
        }
      }
    } catch {
      return null
    }
  }

  return entry
    ? { value: entry.value, savedAt: entry.savedAt, fresh: Date.now() - entry.savedAt < ttlMs }
    : null
}

export function writeCache<T>(key: string, value: T): void {
  const fullKey = `${CACHE_PREFIX}${key}`
  const entry: CacheEntry<T> = { version: CACHE_VERSION, savedAt: Date.now(), value }
  memoryCache.set(fullKey, entry)
  try {
    localStorage.setItem(fullKey, JSON.stringify(entry))
  } catch {
    // The in-memory cache still works when storage is disabled or full.
  }
}