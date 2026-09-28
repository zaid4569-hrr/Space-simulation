import { startTransition, useEffect, useRef, useState } from 'react'
import { readCache, writeCache } from '../services/nasa/cache'

export type DataStatus = 'loading' | 'success' | 'error' | 'offline'
export type DataSource = 'live' | 'cache' | 'fallback'

export interface NasaDataState<T> {
  data: T | null
  status: DataStatus
  source: DataSource | null
  error: string | null
  refetch: () => void
}

type KeyedDataState<T> = Omit<NasaDataState<T>, 'refetch'> & { key: string }

export function useNasaData<T>(
  key: string,
  fetchLive: (signal: AbortSignal) => Promise<T>,
  fallbackUrl: string,
  ttlMs: number,
  isExpected: (value: unknown) => value is T,
): NasaDataState<T> {
  const [requestId, setRequestId] = useState(0)
  const [state, setState] = useState<KeyedDataState<T>>({
    key,
    data: null,
    status: 'loading',
    source: null,
    error: null,
  })
  const fetchLiveRef = useRef(fetchLive)
  const isExpectedRef = useRef(isExpected)

  useEffect(() => {
    fetchLiveRef.current = fetchLive
    isExpectedRef.current = isExpected
  })

  useEffect(() => {
    const controller = new AbortController()
    const cached = readCache<T>(key, ttlMs, isExpectedRef.current)
    let hasUsableData = false

    if (cached) {
      hasUsableData = true
      startTransition(() => setState({ key, data: cached.value, status: 'success', source: 'cache', error: null }))
      if (cached.fresh && requestId === 0) return () => controller.abort()
    }

    void fetchLiveRef.current(controller.signal).then((data) => {
      if (controller.signal.aborted) return
      writeCache(key, data)
      setState({ key, data, status: 'success', source: 'live', error: null })
    }).catch(async (error: unknown) => {
      if (controller.signal.aborted) return
      if (hasUsableData && cached) {
        setState({ key, data: cached.value, status: 'success', source: 'cache', error: null })
        return
      }
      try {
        const response = await fetch(fallbackUrl, { signal: controller.signal })
        if (!response.ok) throw new Error('Fallback data is not available.')
        const data: unknown = await response.json()
        if (!isExpectedRef.current(data)) throw new Error('Fallback data has an unexpected format.')
        if (controller.signal.aborted) return
        setState({
          key,
          data,
          status: 'offline',
          source: 'fallback',
          error: error instanceof Error ? error.message : 'NASA services are unavailable.',
        })
      } catch {
        if (controller.signal.aborted) return
        setState({ key, data: null, status: 'error', source: null, error: 'NASA data and its offline sample could not be loaded.' })
      }
    })

    return () => controller.abort()
  }, [key, fallbackUrl, ttlMs, requestId])

  const isCurrentKey = state.key === key
  return {
    data: isCurrentKey ? state.data : null,
    status: isCurrentKey ? state.status : 'loading',
    source: isCurrentKey ? state.source : null,
    error: isCurrentKey ? state.error : null,
    refetch: () => setRequestId((value) => value + 1),
  }
}