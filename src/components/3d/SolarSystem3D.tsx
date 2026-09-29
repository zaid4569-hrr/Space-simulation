import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { DestinationId } from '../../simulation/mission'
import {
  createEarthTexture,
  createJupiterTexture,
  createMarsTexture,
  createMoonTexture,
  createSaturnRingTexture,
  createSaturnTexture,
  createSunTexture,
} from './planetaryShaders'

interface SolarSystem3DProps {
  destination?: DestinationId | null
  interactive?: boolean
  className?: string
}

export function SolarSystem3D({ destination = 'mars', interactive = false, className }: SolarSystem3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x020304, 0.0008)

    const camera = new THREE.PerspectiveCamera(55, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 3000)
    camera.position.set(0, 40, 320)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x07090e, 1)

    mountRef.current.appendChild(renderer.domElement)

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, destination === 'sun' ? 2.0 : 0.4)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2)
    sunLight.position.set(400, 200, 300)
    scene.add(sunLight)

    // Starfield particles
    const starGeom = new THREE.BufferGeometry()
    const starCount = 4000
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i++) {
      starPos[i] = (Math.random() - 0.5) * 2500
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, transparent: true, opacity: 0.85 })
    const stars = new THREE.Points(starGeom, starMat)
    scene.add(stars)

    // Planet mesh setup
    const planetGroup = new THREE.Group()

    let radius = 100
    let planetMat: THREE.Material
    let atmColor = 0xa9e874
    let hasRings = false

    switch (destination) {
      case 'earth': {
        radius = 95
        const tex = createEarthTexture()
        planetMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.1 })
        atmColor = 0x4488ff
        break
      }
      case 'moon': {
        radius = 80
        const tex = createMoonTexture()
        planetMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.05 })
        atmColor = 0xcccccc
        break
      }
      case 'mars': {
        radius = 90
        const tex = createMarsTexture()
        planetMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0.1 })
        atmColor = 0xff7744
        break
      }
      case 'jupiter': {
        radius = 140
        const tex = createJupiterTexture()
        planetMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.1 })
        atmColor = 0xe3a87c
        break
      }
      case 'saturn': {
        radius = 110
        const tex = createSaturnTexture()
        planetMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.1 })
        atmColor = 0xf4a261
        hasRings = true
        break
      }
      case 'sun': {
        radius = 150
        const tex = createSunTexture()
        planetMat = new THREE.MeshBasicMaterial({ map: tex })
        atmColor = 0xffb703
        break
      }
      default: {
        radius = 90
        const tex = createMarsTexture()
        planetMat = new THREE.MeshStandardMaterial({ map: tex })
        atmColor = 0xff7744
      }
    }

    const planetGeo = new THREE.SphereGeometry(radius, 64, 64)
    const planetMesh = new THREE.Mesh(planetGeo, planetMat)
    planetGroup.add(planetMesh)

    // Atmosphere halo
    const atmosphereGeo = new THREE.SphereGeometry(radius * 1.05, 32, 32)
    const atmosphereMat = new THREE.MeshBasicMaterial({ color: atmColor, transparent: true, opacity: 0.15, side: THREE.BackSide })
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat)
    planetGroup.add(atmosphere)

    // Orbital track ring
    const ringGeo = new THREE.TorusGeometry(radius * 1.6, 0.6, 16, 120)
    const ringMat = new THREE.MeshBasicMaterial({ color: atmColor, transparent: true, opacity: 0.35 })
    const orbitRing = new THREE.Mesh(ringGeo, ringMat)
    orbitRing.rotation.x = Math.PI / 2.3
    planetGroup.add(orbitRing)

    // Saturn planetary rings
    if (hasRings) {
      const saturnRingGeo = new THREE.RingGeometry(radius * 1.3, radius * 2.2, 64)
      const ringTex = createSaturnRingTexture()
      const saturnRingMat = new THREE.MeshStandardMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      const saturnRings = new THREE.Mesh(saturnRingGeo, saturnRingMat)
      saturnRings.rotation.x = Math.PI / 2.2
      planetGroup.add(saturnRings)
    }

    scene.add(planetGroup)

    // Simple interaction rotation drag handling if enabled
    let isDragging = false
    let prevMouseX = 0
    let prevMouseY = 0

    const container = mountRef.current

    function onMouseDown(e: MouseEvent) {
      if (!interactive) return
      isDragging = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    function onMouseMove(e: MouseEvent) {
      if (!interactive || !isDragging) return
      const deltaX = e.clientX - prevMouseX
      const deltaY = e.clientY - prevMouseY
      planetGroup.rotation.y += deltaX * 0.005
      planetGroup.rotation.x += deltaY * 0.005
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    function onMouseUp() {
      isDragging = false
    }

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    const clock = new THREE.Clock()
    let reqId: number

    function animate() {
      reqId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      if (!isDragging) {
        planetMesh.rotation.y += delta * 0.15
        orbitRing.rotation.z += delta * -0.05
        stars.rotation.y += delta * 0.01
      }
      renderer.render(scene, camera)
    }
    animate()

    function onResize() {
      if (!mountRef.current) return
      const w = mountRef.current.clientWidth
      const h = mountRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(reqId)
      window.removeEventListener('resize', onResize)
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
      starGeom.dispose()
      starMat.dispose()
      planetGeo.dispose()
      planetMat.dispose()
      ringGeo.dispose()
      ringMat.dispose()
      atmosphereGeo.dispose()
      atmosphereMat.dispose()
      renderer.dispose()
    }
  }, [destination, interactive])

  return <div ref={mountRef} className={className ?? 'solar-system-3d-canvas'} style={{ width: '100%', height: '100%' }} />
}
