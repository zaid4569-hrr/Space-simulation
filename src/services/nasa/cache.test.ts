import { describe, expect, it } from 'vitest'
import { readCache, writeCache } from './cache'

const isStringRecord = (value: unknown): value is { label: string } =>
  typeof value === 'object' && value !== null && 'label' in value && typeof value.label === 'string'

describe('NASA cache', () => {
  it('reads versioned values from memory and localStorage with TTL freshness', () => {
    const key = `cache-${crypto.randomUUID()}`
    writeCache(key, { label: 'saved' })
    expect(readCache(key, 60_000, isStringRecord)).toMatchObject({ value: { label: 'saved' }, fresh: true })
    expect(readCache(key, 0, isStringRecord)).toMatchObject({ value: { label: 'saved' }, fresh: false })
  })

  it('rejects invalid shapes and implausible future timestamps in localStorage', () => {
    const key = `tampered-${crypto.randomUUID()}`
    localStorage.setItem(`orbital-command:nasa:v1:${key}`, JSON.stringify({
      version: 1,
      savedAt: Date.now() + 24 * 60 * 60 * 1_000,
      value: { label: 'tampered' },
    }))
    expect(readCache(key, 60_000, isStringRecord)).toBeNull()

    const invalidKey = `invalid-${crypto.randomUUID()}`
    localStorage.setItem(`orbital-command:nasa:v1:${invalidKey}`, '{broken')
    expect(readCache(invalidKey, 60_000, isStringRecord)).toBeNull()
  })
})