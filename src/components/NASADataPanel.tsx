import { useCallback, useEffect, useState } from 'react'
import { useNasaData } from '../hooks/useNasaData'
import { getEarthImage, searchDestinationImage, type DestinationId, type NASAImage } from '../services/nasa/nasaService'

function isNASAImage(value: unknown): value is NASAImage {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  const imageUrl = typeof record.imageUrl === 'string' ? record.imageUrl : ''
  const sourceUrl = typeof record.attributionUrl === 'string' ? record.attributionUrl : ''
  const isSafeImage = /^(?:\.\/)?fallback\/media\/(earth|moon|mars)\.jpg$/.test(imageUrl)
    || isHttpsFrom(imageUrl, ['images-assets.nasa.gov', 'epic.gsfc.nasa.gov', 'science.nasa.gov', 'apod.nasa.gov'])
  const isSafeSource = isHttpsFrom(sourceUrl, ['images.nasa.gov', 'nssdc.gsfc.nasa.gov', 'epic.gsfc.nasa.gov', 'science.nasa.gov', 'nasa.gov'])
  const sources = record.sources
  return typeof record.title === 'string' && typeof record.description === 'string'
    && typeof record.date === 'string' && isSafeImage
    && typeof record.attribution === 'string' && isSafeSource
    && typeof record.sourceName === 'string'
    && (sources === undefined || (Array.isArray(sources) && sources.every((source) => {
      if (typeof source !== 'object' || source === null) return false
      const rendition = source as Record<string, unknown>
      return typeof rendition.width === 'number' && rendition.width > 0 && rendition.width <= 1280
        && typeof rendition.url === 'string' && isHttpsFrom(rendition.url, ['images-assets.nasa.gov'])
    })))
}

function isHttpsFrom(value: string, hosts: string[]): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && hosts.includes(url.hostname)
  } catch {
    return false
  }
}

interface NASADataPanelProps {
  destination: DestinationId
  fallbackImageUrl: string
  onSourceChange?: (source: 'live' | 'cache' | 'fallback' | null) => void
}

function NASADataPanelContent({ destination, fallbackImageUrl, onSourceChange }: NASADataPanelProps) {
  const fetchImage = useCallback(
    (signal: AbortSignal) => destination === 'earth' ? getEarthImage(signal) : searchDestinationImage(destination, signal),
    [destination],
  )
  const { data, status, source, error, refetch } = useNasaData<NASAImage>(
    `image-${destination}`,
    fetchImage,
    `${import.meta.env.BASE_URL}fallback/destination-media/${destination}.json`,
    7 * 24 * 60 * 60 * 1_000,
    isNASAImage,
  )
  const [failedDestination, setFailedDestination] = useState<DestinationId | null>(null)

  useEffect(() => {
    onSourceChange?.(source)
  }, [destination, onSourceChange, source])

  const imageFailed = failedDestination === destination
  const imageUrl = imageFailed ? fallbackImageUrl : data?.imageUrl ?? fallbackImageUrl
  const sourceLabel = status === 'loading' && !data
    ? 'LOADING'
    : status === 'error' && !data
      ? 'UNAVAILABLE'
      : imageFailed || source === 'fallback'
        ? 'OFFLINE SAMPLE'
        : source === 'live' ? 'LIVE' : source === 'cache' ? 'CACHED' : 'UNAVAILABLE'
  const displayedSource = imageFailed ? 'fallback' : source ?? (status === 'loading' ? 'loading' : 'unavailable')
  return (
    <section className="nasa-panel" aria-labelledby="nasa-panel-title">
      <div className="nasa-panel__heading">
        <div><p className="eyebrow">Mission archive / {destination}</p><h3 id="nasa-panel-title">NASA image</h3></div>
        <span className={`status-pill status-pill--${displayedSource}`} aria-live="polite"><span className="status-pill__dot" aria-hidden="true" />{sourceLabel}</span>
      </div>
      {status === 'loading' && !data ? <div className="nasa-skeleton" role="status" aria-label="Loading NASA image"><span /></div> : data ? <>
        <div className="nasa-panel__image-wrap"><img className="nasa-panel__image" src={imageUrl} srcSet={!imageFailed ? data.sources?.map((source) => `${source.url} ${source.width}w`).join(', ') : undefined} sizes="(max-width: 700px) 100vw, (max-width: 1200px) 70vw, 900px" alt={`${data.title || destination} mission context`} loading="lazy" decoding="async" onError={() => setFailedDestination(destination)} />
          <span className="image-corner-label">{source === 'fallback' || imageFailed ? 'ARCHIVE SAMPLE' : 'NASA ARCHIVE'}</span>
        </div>
        <div className="nasa-panel__copy"><div className="nasa-panel__title-row"><h4>{imageFailed ? 'Destination archive sample' : data.title}</h4>{data.date && <time dateTime={data.date.slice(0, 10)}>{data.date.slice(0, 10)}</time>}</div>
          <p>{data.description || 'A NASA archive image selected for mission context.'}</p>
          <div className="nasa-panel__attribution"><span>{imageFailed ? 'NASA destination archive' : `${data.sourceName} · ${data.attribution}`}</span><a href={imageFailed ? 'https://images.nasa.gov/' : data.attributionUrl} target="_blank" rel="noopener noreferrer">Source details <span aria-hidden="true">↗</span></a></div>
        </div>
      </> : <div className="nasa-panel__empty" role="status"><strong>NASA imagery is unavailable right now.</strong><p>The mission remains playable without this image.</p><button className="text-button" type="button" onClick={refetch}>Try NASA again</button></div>}
      {error && source === 'fallback' && <p className="inline-note nasa-panel__note">Showing the bundled sample while NASA services are unavailable.</p>}
    </section>
  )
}

export default function NASADataPanel(props: NASADataPanelProps) {
  return <NASADataPanelContent {...props} />
}