import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useNasaData } from './useNasaData'
import { writeCache } from '../services/nasa/cache'

interface Sample {
  label: string
}

const isSample = (value: unknown): value is Sample => typeof value === 'object' && value !== null && 'label' in value && typeof value.label === 'string'
const fallback = '/fallback/test.json'

describe('useNasaData', () => {
  it('uses fresh cache without making a live request', async () => {
    const key = `fresh-${crypto.randomUUID()}`
    writeCache(key, { label: 'cached' })
    const fetchLive = vi.fn().mockResolvedValue({ label: 'live' })
    const { result } = renderHook(() => useNasaData(key, fetchLive, fallback, 60_000, isSample))
    await waitFor(() => expect(result.current.data).toEqual({ label: 'cached' }))
    expect(result.current.source).toBe('cache')
    expect(fetchLive).not.toHaveBeenCalled()
  })

  it('renders stale cache while revalidating, then replaces it with fresh live data', async () => {
    const key = `stale-${crypto.randomUUID()}`
    writeCache(key, { label: 'old' })
    const fetchLive = vi.fn().mockResolvedValue({ label: 'new' })
    const { result } = renderHook(() => useNasaData(key, fetchLive, fallback, 0, isSample))

    await waitFor(() => expect(result.current.data).toEqual({ label: 'new' }))
    expect(fetchLive).toHaveBeenCalledTimes(1)
    expect(result.current.source).toBe('live')
  })

  it('falls back to validated bundled data on offline/rejected live requests', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response('{"label":"offline sample"}', { status: 200 }))))
    const key = `offline-${crypto.randomUUID()}`
    const { result } = renderHook(() => useNasaData(key, () => Promise.reject(new Error('offline')), fallback, 1_000, isSample))
    await waitFor(() => expect(result.current.status).toBe('offline'))
    expect(result.current.data).toEqual({ label: 'offline sample' })
    expect(result.current.source).toBe('fallback')
  })

  it('rejects malformed fallback data instead of exposing it to the component', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response('{"label":42}', { status: 200 }))))
    const key = `bad-${crypto.randomUUID()}`
    const { result } = renderHook(() => useNasaData(key, () => Promise.reject(new Error('offline')), fallback, 1_000, isSample))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.data).toBeNull()
  })

  it('does not expose late data from a previous destination after a key change', async () => {
    let resolveFirst: ((value: Sample) => void) | undefined
    let resolveSecond: ((value: Sample) => void) | undefined
    const fetchLive = vi.fn((signal: AbortSignal) => new Promise<Sample>((resolve) => {
      if (signal.aborted) return
      if (fetchLive.mock.calls.length === 1) resolveFirst = resolve
      else resolveSecond = resolve
    }))
    const { result, rerender } = renderHook(({ key }) => useNasaData(key, fetchLive, fallback, 1_000, isSample), { initialProps: { key: 'mars' } })
    await waitFor(() => expect(fetchLive).toHaveBeenCalledTimes(1))
    rerender({ key: 'moon' })
    expect(result.current.data).toBeNull()
    await waitFor(() => expect(fetchLive).toHaveBeenCalledTimes(2))

    await act(async () => { resolveFirst?.({ label: 'late Mars' }) })
    expect(result.current.data).toBeNull()
    await act(async () => { resolveSecond?.({ label: 'Moon' }) })
    await waitFor(() => expect(result.current.data).toEqual({ label: 'Moon' }))
  })
})