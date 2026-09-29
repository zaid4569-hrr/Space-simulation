import * as THREE from 'three'

/**
 * Generates procedural textures for 3D celestial bodies without requiring external asset files.
 */

export function createEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  // Ocean base
  ctx.fillStyle = '#0b2545'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Continents procedural render
  ctx.fillStyle = '#2d6a4f'
  const seedPoints = [
    { x: 300, y: 200, r: 120 }, // N. America
    { x: 350, y: 350, r: 100 }, // S. America
    { x: 550, y: 220, r: 90 },  // Europe
    { x: 580, y: 330, r: 140 }, // Africa
    { x: 750, y: 200, r: 180 }, // Asia
    { x: 820, y: 380, r: 90 },  // Australia
  ]

  for (const pt of seedPoints) {
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2)
    ctx.fill()

    // Add terrain variation
    for (let i = 0; i < 15; i++) {
      const offsetX = (Math.sin(i * 3) * pt.r * 0.6)
      const offsetY = (Math.cos(i * 2) * pt.r * 0.6)
      ctx.fillStyle = i % 2 === 0 ? '#40916c' : '#74c69d'
      ctx.beginPath()
      ctx.arc(pt.x + offsetX, pt.y + offsetY, pt.r * 0.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Polar caps
  ctx.fillStyle = '#e9ecef'
  ctx.fillRect(0, 0, canvas.width, 30)
  ctx.fillRect(0, canvas.height - 30, canvas.width, 30)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function createMoonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  // Lunar surface base
  ctx.fillStyle = '#6c757d'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Lunar Maria (dark basaltic plains)
  ctx.fillStyle = '#495057'
  const maria = [
    { x: 400, y: 200, r: 100 },
    { x: 500, y: 250, r: 120 },
    { x: 300, y: 180, r: 70 },
    { x: 600, y: 180, r: 80 },
  ]
  for (const m of maria) {
    ctx.beginPath()
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Craters
  ctx.fillStyle = '#adb5bd'
  ctx.strokeStyle = '#343a40'
  ctx.lineWidth = 2
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const r = Math.random() * 15 + 3
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function createMarsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  // Red rust base
  ctx.fillStyle = '#9e2a2b'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Dark basaltic highlands & Valles Marineris canyon strip
  ctx.fillStyle = '#540b0e'
  ctx.fillRect(200, 220, 600, 40)

  for (let i = 0; i < 40; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const r = Math.random() * 80 + 20
    ctx.fillStyle = i % 2 === 0 ? '#6e1414' : '#bd3a3a'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Polar ice caps
  ctx.fillStyle = '#f8f9fa'
  ctx.fillRect(0, 0, canvas.width, 25)
  ctx.fillRect(0, canvas.height - 25, canvas.width, 25)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function createJupiterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  // Gas giant bands
  const bandColors = ['#cc8b65', '#8a502e', '#e3a87c', '#63331a', '#e6be9a', '#94532d', '#d49b70']
  const bandHeight = canvas.height / bandColors.length
  for (let i = 0; i < bandColors.length; i++) {
    ctx.fillStyle = bandColors[i]!
    ctx.fillRect(0, i * bandHeight, canvas.width, bandHeight + 2)
  }

  // Great Red Spot storm
  ctx.fillStyle = '#b02a02'
  ctx.beginPath()
  ctx.ellipse(650, 320, 70, 45, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = '#e6be9a'
  ctx.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function createSaturnTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  // Golden/butterscotch bands
  const bandColors = ['#e9c46a', '#f4a261', '#e76f51', '#d4a373', '#faedcd', '#ccd5ae']
  const bandHeight = canvas.height / bandColors.length
  for (let i = 0; i < bandColors.length; i++) {
    ctx.fillStyle = bandColors[i]!
    ctx.fillRect(0, i * bandHeight, canvas.width, bandHeight + 2)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function createSaturnRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(0.1, 'rgba(233, 196, 106, 0.4)')
  grad.addColorStop(0.3, 'rgba(244, 162, 97, 0.8)')
  grad.addColorStop(0.5, 'rgba(0,0,0,0.1)') // Cassini division gap
  grad.addColorStop(0.65, 'rgba(212, 163, 115, 0.7)')
  grad.addColorStop(0.9, 'rgba(250, 237, 205, 0.5)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function createSunTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  // Solar flare yellow/orange baseline
  ctx.fillStyle = '#ffb703'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Sunspot & solar granule noise
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const r = Math.random() * 20 + 5
    ctx.fillStyle = i % 5 === 0 ? '#d4d700' : '#fb8500'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Dark sunspots
  ctx.fillStyle = '#9e2a2b'
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    ctx.beginPath()
    ctx.arc(x, y, Math.random() * 12 + 4, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
