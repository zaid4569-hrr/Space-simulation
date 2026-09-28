const ALLOWED_HOSTS = new Set([
  'api.nasa.gov',
  'images-api.nasa.gov',
  'science.nasa.gov',
  'eonet.gsfc.nasa.gov',
  'epic.gsfc.nasa.gov',
])
const REQUEST_TIMEOUT_MS = 8_000
const MAX_RETRIES = 2

export class NasaRequestError extends Error {
  readonly status?: number

  constructor(
    message: string,
    status?: number,
  ) {
    super(message)
    this.name = 'NasaRequestError'
    this.status = status
  }
}

function isJsonContentType(value: string | null): boolean {
  const normalized = value?.toLowerCase() ?? ''
  return normalized.includes('application/json') || normalized.includes('+json')
}

function buildUrl(input: string): URL {
  const url = new URL(input)
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new NasaRequestError('NASA request URL is not allowlisted.')
  }

  if (url.hostname === 'api.nasa.gov') {
    const key = import.meta.env.VITE_NASA_API_KEY?.trim() || 'DEMO_KEY'
    url.searchParams.set('api_key', key)
  }
  return url
}

function retryDelay(attempt: number, retryAfter: string | null): number {
  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds * 1_000, 4_000)
  const retryDate = retryAfter ? Date.parse(retryAfter) : Number.NaN
  if (Number.isFinite(retryDate)) return Math.min(Math.max(0, retryDate - Date.now()), 4_000)
  return Math.min(350 * 2 ** attempt, 1_400)
}

function waitForRetry(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('NASA request was cancelled.', 'AbortError'))
      return
    }
    const finish = () => {
      signal?.removeEventListener('abort', cancel)
      resolve()
    }
    const timer = window.setTimeout(finish, milliseconds)
    const cancel = () => {
      window.clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
      reject(new DOMException('NASA request was cancelled.', 'AbortError'))
    }
    signal?.addEventListener('abort', cancel, { once: true })
  })
}

export async function nasaFetchJson<T>(
  input: string,
  isExpected: (value: unknown) => value is T,
  signal?: AbortSignal,
): Promise<T> {
  const url = buildUrl(input)

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    if (signal?.aborted) throw new NasaRequestError('NASA request was cancelled.')
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const abortFromCaller = () => controller.abort()
    if (signal?.aborted) controller.abort()
    else signal?.addEventListener('abort', abortFromCaller, { once: true })

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })

      if (response.status === 429 || response.status >= 500) {
        if (attempt < MAX_RETRIES) {
          await waitForRetry(retryDelay(attempt, response.headers.get('Retry-After')), signal)
          continue
        }
        throw new NasaRequestError(`NASA service returned ${response.status}.`, response.status)
      }
      if (!response.ok) {
        throw new NasaRequestError(`NASA service returned ${response.status}.`, response.status)
      }
      if (!isJsonContentType(response.headers.get('Content-Type'))) {
        throw new NasaRequestError('NASA service returned a non-JSON response.')
      }

      let value: unknown
      try {
        value = await response.json()
      } catch {
        throw new NasaRequestError('NASA service returned invalid JSON.')
      }
      if (!isExpected(value)) throw new NasaRequestError('NASA service response had an unexpected shape.')
      return value
    } catch (error) {
      if (error instanceof NasaRequestError) throw error
      const wasAborted = controller.signal.aborted
      if (attempt < MAX_RETRIES && !wasAborted && !signal?.aborted) {
        await waitForRetry(retryDelay(attempt, null), signal)
        continue
      }
      throw new NasaRequestError(
        wasAborted ? 'NASA request timed out or was cancelled.' : 'NASA service is unavailable.',
      )
    } finally {
      window.clearTimeout(timeout)
      signal?.removeEventListener('abort', abortFromCaller)
    }
  }

  throw new NasaRequestError('NASA service is unavailable.')
}