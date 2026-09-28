import { afterEach, describe, expect, it, vi } from 'vitest'
import { getEarthImage, getEonetEvents, getSpaceFact, searchDestinationImage } from './nasaService'

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

afterEach(() => vi.useRealTimers())

describe('NASA source normalizers', () => {
  it('normalizes Image Library metadata and only accepts NASA asset URLs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ collection: { items: [{
      data: [{ media_type: 'image', title: 'Mars surface', nasa_id: 'PIA123', date_created: '2024-01-01', description: '<b>NASA</b> image', secondary_creator: 'NASA/JPL' }],
      links: [
        { rel: 'preview', render: 'image', href: 'https://images-assets.nasa.gov/image/PIA123/PIA123~small.jpg', width: 640 },
        { rel: 'alternate', render: 'image', href: 'https://images-assets.nasa.gov/image/PIA123/PIA123~large.jpg', width: 1920 },
        { rel: 'preview', render: 'image', href: 'https://evil.example/image.jpg', width: 320 },
      ],
    }] } })))

    const image = await searchDestinationImage('mars')
    expect(image.title).toBe('Mars surface')
    expect(image.description).toBe('NASA image')
    expect(image.imageUrl).toContain('images-assets.nasa.gov')
    expect(image.attributionUrl).toBe('https://images.nasa.gov/details/PIA123')
    expect(image.sources?.every((source) => source.width <= 1280 && source.url.includes('images-assets.nasa.gov'))).toBe(true)
  })

  it('returns an explicit error for empty or unusable image search results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ collection: { items: [] } })))
    await expect(searchDestinationImage('moon')).rejects.toThrow(/No usable NASA image/)
  })

  it('constructs EPIC archive imagery from a validated image id and date', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([{ image: 'epic_1b_20260926004554', date: '2026-09-26 00:41:06', caption: 'Earth image' }])))
    const image = await getEarthImage()
    expect(image.imageUrl).toBe('https://epic.gsfc.nasa.gov/archive/natural/2026/09/26/jpg/epic_1b_20260926004554.jpg')
    expect(image.attributionUrl).toBe('https://epic.gsfc.nasa.gov/about/api')
  })

  it('rejects malformed EPIC identifiers and does not build an arbitrary archive URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([{ image: '../evil', date: '2026-09-26' }])))
    await expect(getEarthImage()).rejects.toThrow(/No current EPIC image/)
  })

  it('drops EONET records whose source URL is not an EONET HTTPS link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ events: [
      { title: 'Flood', link: 'https://eonet.gsfc.nasa.gov/api/v3/events/1', description: '<script>alert(1)</script>', geometry: [{ date: '2026-09-28' }] },
      { title: 'Spoofed event', link: 'javascript:alert(1)', geometry: [] },
    ] })))
    const events = await getEonetEvents()
    expect(events).toHaveLength(1)
    expect(events[0]?.sourceUrl).toMatch(/^https:\/\/eonet\.gsfc\.nasa\.gov\//)
    expect(events[0]?.description).not.toContain('<script>')
  })

  it('uses the current APOD Basic feed and strips markup from explanation text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ title: 'Nebula', date: '2026-09-28', explanation: '<p>A NASA description.</p>', media_type: 'image', url: 'https://science.nasa.gov/photo.jpg' }]))
    vi.stubGlobal('fetch', fetchMock)
    const fact = await getSpaceFact()
    expect(new URL(fetchMock.mock.calls[0]?.[0] as string).origin).toBe('https://science.nasa.gov')
    expect(fact.description).toBe('A NASA description.')
    expect(fact.imageUrl).toBe('https://science.nasa.gov/photo.jpg')
  })
})