import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { DestinationId } from '../simulation/mission'
import {
  createEarthTexture,
  createJupiterTexture,
  createMarsTexture,
  createMoonTexture,
  createSaturnTexture,
  createSunTexture,
} from './3d/planetaryShaders'

interface SpaceCanvasProps {
  destination?: DestinationId | null
  phase?: 'home' | 'briefing' | 'design' | 'simulation' | 'report' | null
}

export function SpaceCanvas({ destination, phase }: SpaceCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x020304, 0.0008)

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000)
    camera.position.z = 400

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x07090e, 1)

    mountRef.current.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0)
    sunLight.position.set(300, 200, 200)
    scene.add(sunLight)

    // Starfield particles
    const starGeom = new THREE.BufferGeometry()
    const starCount = 3500
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i++) {
      starPos[i] = (Math.random() - 0.5) * 2000
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0.8, sizeAttenuation: true })
    const stars = new THREE.Points(starGeom, starMat)
    scene.add(stars)

    // Planet Group
    const planetGroup = new THREE.Group()

    let texture: THREE.CanvasTexture
    let atmColor = 0xa9e874
    let radius = 110

    switch (destination) {
      case 'earth':
        texture = createEarthTexture()
        atmColor = 0x4488ff
        break
      case 'moon':
        texture = createMoonTexture()
        atmColor = 0xdddddd
        radius = 90
        break
      case 'mars':
        texture = createMarsTexture()
        atmColor = 0xff7744
        break
      case 'jupiter':
        texture = createJupiterTexture()
        atmColor = 0xe3a87c
        radius = 130
        break
      case 'saturn':
        texture = createSaturnTexture()
        atmColor = 0xf4a261
        break
      case 'sun':
        texture = createSunTexture()
        atmColor = 0xffb703
        radius = 140
        break
      default:
        texture = createMarsTexture()
        atmColor = 0xff7744
    }

    const geo = new THREE.SphereGeometry(radius, 48, 48)
    const mat = destination === 'sun'
      ? new THREE.MeshBasicMaterial({ map: texture })
      : new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6, metalness: 0.1 })
    const planet = new THREE.Mesh(geo, mat)
    planetGroup.add(planet)

    const atmosphereGeo = new THREE.SphereGeometry(radius * 1.05, 32, 32)
    const atmosphereMat = new THREE.MeshBasicMaterial({ color: atmColor, transparent: true, opacity: 0.12, side: THREE.BackSide })
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat)
    planetGroup.add(atmosphere)

    // Orbital rings
    const ringGeo = new THREE.TorusGeometry(radius * 1.5, 0.5, 16, 100)
    const ringMat = new THREE.MeshBasicMaterial({ color: atmColor, transparent: true, opacity: 0.25 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2.2
    planetGroup.add(ring)

    scene.add(planetGroup)

    // Position logic based on phase
    if (phase === 'home') {
      planetGroup.position.set(220, 0, 0)
      camera.position.z = 400
    } else if (phase === 'simulation') {
      planetGroup.position.set(0, 0, 0)
      camera.position.z = 260
    } else {
      planetGroup.position.set(300, -100, -200)
    }

    const clock = new THREE.Clock()
    let reqId: number

    function animate() {
      reqId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      stars.rotation.y = t * 0.015
      planetGroup.rotation.y = t * 0.04
      ring.rotation.z = t * -0.08
      renderer.render(scene, camera)
    }
    animate()

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(reqId)
      window.removeEventListener('resize', onResize)
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
      starGeom.dispose()
      starMat.dispose()
      geo.dispose()
      mat.dispose()
      atmosphereGeo.dispose()
      atmosphereMat.dispose()
      ringGeo.dispose()
      ringMat.dispose()
      renderer.dispose()
    }
  }, [destination, phase])

  return <div ref={mountRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }} />
}