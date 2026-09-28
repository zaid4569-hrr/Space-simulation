import { nasaFetchJson } from './nasaClient'

export type DestinationId = 'earth' | 'moon' | 'mars'

export interface DestinationFact {
  id: DestinationId
  name: string
  distanceLabel: string
  distance: string
  gravity: string
  dayLength: string
  environment: string
  notableMission: string
  notableMissionUrl: string
  factSheetUrl: string
  imageUrl: string
  imageAlt: string
}

export interface NASAImage {
  title: string
  description: string
  date: string
  imageUrl: string
  sources?: Array<{ url: string; width: number }>
  attribution: string
  attributionUrl: string
  sourceName: string
}

interface ImageItem {
  data?: Array<Record<string, unknown>>
  links?: Array<Record<string, unknown>>
}

interface ImageSearchResponse {
  collection?: { items?: ImageItem[] }
}

interface EonetResponse {
  events?: Array<Record<string, unknown>>
}

interface EpicImage {
  image?: string
  date?: string
  caption?: string
}

interface ApodEntry {
  date?: string
  title?: string
  explanation?: string
  media_type?: string
  hdurl?: string
  url?: string
}

export interface NASAEvent {
  title: string
  date: string
  description: string
  sourceUrl: string
}

export interface SpaceFact {
  title: string
  date: string
  description: string
  imageUrl?: string
  attributionUrl: string
}

const IMAGE_API = 'https://images-api.nasa.gov/search'
const APOD_FEED = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic'
const EONET_EVENTS = 'https://eonet.gsfc.nasa.gov/api/v3/events?limit=8&days=14'
const EPIC_NATURAL = 'https://epic.gsfc.nasa.gov/api/natural'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isImageSearchResponse(value: unknown): value is ImageSearchResponse {
  return isRecord(value) && isRecord(value.collection) && Array.isArray(value.collection.items)
}

function isEonetResponse(value: unknown): value is EonetResponse {
  return isRecord(value) && Array.isArray(value.events)
}

function isEpicResponse(value: unknown): value is EpicImage[] {
  return Array.isArray(value) && value.every(isRecord)
}

function isApodResponse(value: unknown): value is ApodEntry[] {
  return Array.isArray(value) && value.every(isRecord)
}

function text(value: unknown, maxLength = 700): string {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim().slice(0, maxLength) : ''
}

function safeHttpsUrl(value: unknown, allowedHosts: string[]): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && allowedHosts.includes(url.hostname) ? url.toString() : null
  } catch {
    return null
  }
}

export async function searchDestinationImage(
  destination: DestinationId,
  signal?: AbortSignal,
): Promise<NASAImage> {
  const query = destination === 'earth' ? 'Earth from space NASA' : `${destination} surface NASA mission`
  const url = new URL(IMAGE_API)
  url.searchParams.set('q', query)
  url.searchParams.set('media_type', 'image')
  url.searchParams.set('page_size', '20')
  const response = await nasaFetchJson(url.toString(), isImageSearchResponse, signal)
  const candidates = response.collection?.items ?? []

  for (const item of candidates) {
    const data = item.data?.[0]
    if (!data || data.media_type !== 'image') continue
    const link = item.links?.find((entry) => entry.render === 'image' && entry.rel === 'preview')
      ?? item.links?.find((entry) => entry.render === 'image' && entry.rel === 'alternate')
    const imageUrl = safeHttpsUrl(link?.href, ['images-assets.nasa.gov'])
    if (!imageUrl) continue
    const sources = (item.links ?? []).flatMap((entry) => {
      const url = safeHttpsUrl(entry.href, ['images-assets.nasa.gov'])
      const width = entry.width
      return entry.render === 'image' && typeof width === 'number' && width > 0 && width <= 1280 && url
        ? [{ url, width }]
        : []
    }).filter((source, index, all) => all.findIndex((candidate) => candidate.width === source.width) === index)

    const id = text(data.nasa_id, 100)
    return {
      title: text(data.title, 140) || 'NASA image',
      description: text(data.description_508 ?? data.description, 500),
      date: text(data.date_created, 40),
      imageUrl,
      sources,
      attribution: text(data.secondary_creator ?? data.photographer ?? data.center, 160) || 'NASA',
      attributionUrl: `https://images.nasa.gov/details/${encodeURIComponent(id)}`,
      sourceName: 'NASA Image and Video Library',
    }
  }
  throw new Error('No usable NASA image was found for this destination.')
}

export async function getEarthImage(signal?: AbortSignal): Promise<NASAImage> {
  const images = await nasaFetchJson(EPIC_NATURAL, isEpicResponse, signal)
  const item = images.find((entry) => typeof entry.image === 'string' && /^epic_[a-z0-9_]+$/i.test(entry.image))
  if (!item?.image || typeof item.date !== 'string') throw new Error('No current EPIC image is available.')

  const match = item.date.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) throw new Error('EPIC returned an invalid image date.')
  const [, year, month, day] = match
  const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/jpg/${item.image}.jpg`
  return {
    title: 'Earth from NASA EPIC',
    description: text(item.caption, 400) || 'Earth imagery from DSCOVR’s EPIC instrument.',
    date: item.date,
    imageUrl,
    attribution: 'NASA EPIC / DSCOVR',
    attributionUrl: 'https://epic.gsfc.nasa.gov/about/api',
    sourceName: 'NASA EPIC',
  }
}

export async function getEonetEvents(signal?: AbortSignal): Promise<NASAEvent[]> {
  const response = await nasaFetchJson(EONET_EVENTS, isEonetResponse, signal)
  return (response.events ?? []).slice(0, 8).flatMap((event) => {
    const title = text(event.title, 140)
    const geometry = Array.isArray(event.geometry) ? event.geometry.find(isRecord) : undefined
    const date = geometry ? text(geometry.date, 40) : ''
    const sourceUrl = safeHttpsUrl(event.link, ['eonet.gsfc.nasa.gov'])
    if (!title || !sourceUrl) return []
    return [{ title, date, description: text(event.description, 300) || 'NASA Earth-observation event record.', sourceUrl }]
  })
}

export async function getSpaceFact(signal?: AbortSignal): Promise<SpaceFact> {
  const url = new URL(APOD_FEED)
  url.searchParams.set('page', '1')
  url.searchParams.set('per_page', '1')
  const response = await nasaFetchJson(url.toString(), isApodResponse, signal)
  const item = response.find((entry) => typeof entry.title === 'string' && typeof entry.explanation === 'string')
  if (!item) throw new Error('No APOD item is available.')
  const imageUrl = item.media_type === 'image'
    ? safeHttpsUrl(item.hdurl ?? item.url, ['science.nasa.gov', 'apod.nasa.gov', 'images-assets.nasa.gov']) ?? undefined
    : undefined
  return {
    title: text(item.title, 140),
    date: text(item.date, 40),
    description: text(item.explanation, 700),
    imageUrl,
    attributionUrl: 'https://science.nasa.gov/solar-system/apod/',
  }
}