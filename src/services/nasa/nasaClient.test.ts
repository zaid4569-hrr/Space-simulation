import { afterEach, describe, expect, it, vi } from 'vitest'
import { nasaFetchJson, NasaRequestError } from './nasaClient'

interface SampleResponse {
  ok: boolean
}

function isSampleResponse(value: unknown): value is SampleResponse {
  return typeof value === 'object' && value !== null && 'ok' in value && typeof value.ok === 'boolean'
}

function jsonResponse(body: string, status = 200, contentType = 'application/json') {
  return new Response(body, { status, headers: { 'Content-Type': contentType } })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('nasaFetchJson', () => {
  it('returns validated JSON from an allowlisted NASA HTTPS host', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse('{"ok":true}')))
    await expect(nasaFetchJson('https://images-api.nasa.gov/search?q=mars', isSampleResponse)).resolves.toEqual({ ok: true })
  })

  it('rejects non-HTTPS and non-NASA hosts before making a request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(nasaFetchJson('http://images-api.nasa.gov/search', isSampleResponse)).rejects.toThrow(NasaRequestError)
    await expect(nasaFetchJson('https://example.com/data', isSampleResponse)).rejects.toThrow(NasaRequestError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not retry ordinary 4xx responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse('{"error":"not found"}', 404))
    vi.stubGlobal('fetch', fetchMock)
    await expect(nasaFetchJson('https://images-api.nasa.gov/search', isSampleResponse)).rejects.toMatchObject({ status: 404 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([429, 503])('retries status %i at most twice and succeeds', async (status) => {
    vi.useFakeTimers()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse('{}', status))
      .mockResolvedValueOnce(jsonResponse('{}', status))
      .mockResolvedValueOnce(jsonResponse('{"ok":true}'))
    vi.stubGlobal('fetch', fetchMock)

    const request = nasaFetchJson('https://images-api.nasa.gov/search', isSampleResponse)
    const assertion = expect(request).resolves.toEqual({ ok: true })
    await vi.runAllTimersAsync()
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('stops after two retries when rate limited or the server remains unavailable', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse('{}', 429))
    vi.stubGlobal('fetch', fetchMock)
    const request = nasaFetchJson('https://images-api.nasa.gov/search', isSampleResponse)
    const assertion = expect(request).rejects.toMatchObject({ status: 429 })
    await vi.runAllTimersAsync()
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('rejects malformed JSON, non-JSON content types, and shape mismatches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse('{')))
    await expect(nasaFetchJson('https://images-api.nasa.gov/search', isSampleResponse)).rejects.toThrow(/invalid JSON/i)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse('<html/>', 200, 'text/html')))
    await expect(nasaFetchJson('https://images-api.nasa.gov/search', isSampleResponse)).rejects.toThrow(/non-JSON/i)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse('{"wrong":true}')))
    await expect(nasaFetchJson('https://images-api.nasa.gov/search', isSampleResponse)).rejects.toThrow(/unexpected shape/i)
  })

  it('times out at eight seconds and aborts the underlying fetch', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    }))
    vi.stubGlobal('fetch', fetchMock)
    const request = nasaFetchJson('https://images-api.nasa.gov/search', isSampleResponse)
    const assertion = expect(request).rejects.toThrow(/timed out/i)
    await vi.advanceTimersByTimeAsync(8_000)
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('aborts during retry backoff without starting another request', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse('{}', 429))
    vi.stubGlobal('fetch', fetchMock)
    const request = nasaFetchJson('https://images-api.nasa.gov/search', isSampleResponse, controller.signal)
    const assertion = expect(request).rejects.toThrow()
    await Promise.resolve()
    controller.abort()
    await vi.runAllTimersAsync()
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('uses DEMO_KEY when an api.nasa.gov integration has no configured key', async () => {
    vi.stubEnv('VITE_NASA_API_KEY', '')
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse('{"ok":true}'))
    vi.stubGlobal('fetch', fetchMock)
    await nasaFetchJson('https://api.nasa.gov/example', isSampleResponse)
    const requestUrl = new URL(fetchMock.mock.calls[0]?.[0] as string)
    expect(requestUrl.searchParams.get('api_key')).toBe('DEMO_KEY')
  })
})