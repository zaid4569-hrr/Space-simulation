import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NASADataPanel from './NASADataPanel'
import { useNasaData } from '../hooks/useNasaData'
import type { NASAImage } from '../services/nasa/nasaService'

vi.mock('../hooks/useNasaData', () => ({ useNasaData: vi.fn() }))

const hook = vi.mocked(useNasaData<NASAImage>)
const nasaImage: NASAImage = {
  title: 'Mars survey image',
  description: 'NASA mission archive image.',
  date: '2026-09-28',
  imageUrl: 'https://images-assets.nasa.gov/image/PIA00001/PIA00001~small.jpg',
  sources: [{ url: 'https://images-assets.nasa.gov/image/PIA00001/PIA00001~small.jpg', width: 640 }],
  attribution: 'NASA/JPL',
  attributionUrl: 'https://images.nasa.gov/details/PIA00001',
  sourceName: 'NASA Image and Video Library',
}

describe('NASADataPanel', () => {
  beforeEach(() => {
    hook.mockReset()
  })

  it('renders a loading skeleton with a loading badge', () => {
    hook.mockReturnValue({ data: null, status: 'loading', source: null, error: null, refetch: vi.fn() })
    render(<NASADataPanel destination="mars" fallbackImageUrl="/fallback/media/mars.jpg" />)
    expect(screen.getByRole('status', { name: 'Loading NASA image' })).toBeInTheDocument()
    expect(screen.getByText('LOADING')).toBeInTheDocument()
  })

  it('renders live image, responsive source, date, attribution and LIVE badge', () => {
    hook.mockReturnValue({ data: nasaImage, status: 'success', source: 'live', error: null, refetch: vi.fn() })
    render(<NASADataPanel destination="mars" fallbackImageUrl="/fallback/media/mars.jpg" />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Mars survey image/ })).toHaveAttribute('srcSet', expect.stringContaining('640w'))
    expect(screen.getByText(/NASA\/JPL/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Source details/ })).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders cached state distinctly', () => {
    hook.mockReturnValue({ data: nasaImage, status: 'success', source: 'cache', error: null, refetch: vi.fn() })
    render(<NASADataPanel destination="moon" fallbackImageUrl="/fallback/media/moon.jpg" />)
    expect(screen.getByText('CACHED')).toBeInTheDocument()
  })

  it('labels bundled fallback accurately and reports the source state upward', async () => {
    const onSourceChange = vi.fn()
    hook.mockReturnValue({ data: { ...nasaImage, imageUrl: '/fallback/media/mars.jpg', sources: undefined, sourceName: 'NASA archive sample' }, status: 'offline', source: 'fallback', error: 'offline', refetch: vi.fn() })
    render(<NASADataPanel destination="mars" fallbackImageUrl="/fallback/media/mars.jpg" onSourceChange={onSourceChange} />)
    expect(screen.getByText('OFFLINE SAMPLE')).toBeInTheDocument()
    expect(screen.getByText(/Showing the bundled sample/)).toBeInTheDocument()
    await waitFor(() => expect(onSourceChange).toHaveBeenCalledWith('fallback'))
  })

  it('shows friendly terminal error rather than claiming a sample exists', () => {
    hook.mockReturnValue({ data: null, status: 'error', source: null, error: 'failed', refetch: vi.fn() })
    render(<NASADataPanel destination="earth" fallbackImageUrl="/fallback/media/earth.jpg" />)
    expect(screen.getByText('UNAVAILABLE')).toBeInTheDocument()
    expect(screen.getByText(/NASA imagery is unavailable right now/)).toBeInTheDocument()
  })
})