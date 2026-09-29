import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { DestinationId, MissionTotals } from '../../simulation/mission'
import {
  createEarthTexture,
  createJupiterTexture,
  createMarsTexture,
  createMoonTexture,
  createSaturnRingTexture,
  createSaturnTexture,
  createSunTexture,
} from './planetaryShaders'

interface InteractiveSimulation3DProps {
  destination: DestinationId
  selectedIds: readonly string[]
  totals: MissionTotals
  elapsedSeconds: number
  isCrisis: boolean
  className?: string
}

type CameraMode = 'chase' | 'orbit' | 'free'

export function InteractiveSimulation3D({
  destination,
  selectedIds,
  totals,
  elapsedSeconds,
  isCrisis,
  className,
}: InteractiveSimulation3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase')

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x020408, 0.0006)

    const camera = new THREE.PerspectiveCamera(50, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 4000)
    camera.position.set(0, 30, 180)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x04060a, 1)

    mountRef.current.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5)
    sunLight.position.set(500, 300, 400)
    scene.add(sunLight)

    // Starfield skybox
    const starGeom = new THREE.BufferGeometry()
    const starCount = 5000
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i++) {
      starPos[i] = (Math.random() - 0.5) * 3500
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0.85 })
    const stars = new THREE.Points(starGeom, starMat)
    scene.add(stars)

    // 1. Destination Planet Group
    const planetGroup = new THREE.Group()
    let radius = 120
    let planetMat: THREE.Material
    let atmColor = 0xa9e874
    let hasRings = false

    switch (destination) {
      case 'earth': {
        radius = 110
        const tex = createEarthTexture()
        planetMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.1 })
        atmColor = 0x4488ff
        break
      }
      case 'moon': {
        radius = 90
        const tex = createMoonTexture()
        planetMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.05 })
        atmColor = 0xdddddd
        break
      }
      case 'mars': {
        radius = 100
        const tex = createMarsTexture()
        planetMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0.1 })
        atmColor = 0xff7744
        break
      }
      case 'jupiter': {
        radius = 160
        const tex = createJupiterTexture()
        planetMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.1 })
        atmColor = 0xe3a87c
        break
      }
      case 'saturn': {
        radius = 130
        const tex = createSaturnTexture()
        planetMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.1 })
        atmColor = 0xf4a261
        hasRings = true
        break
      }
      case 'sun': {
        radius = 170
        const tex = createSunTexture()
        planetMat = new THREE.MeshBasicMaterial({ map: tex })
        atmColor = 0xffb703
        break
      }
      default: {
        radius = 100
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
    const atmosphereMat = new THREE.MeshBasicMaterial({ color: atmColor, transparent: true, opacity: 0.18, side: THREE.BackSide })
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat)
    planetGroup.add(atmosphere)

    // Orbit path ring
    const orbitRadius = radius * 1.8
    const ringGeo = new THREE.TorusGeometry(orbitRadius, 0.8, 16, 150)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa9e874, transparent: true, opacity: 0.4 })
    const orbitRing = new THREE.Mesh(ringGeo, ringMat)
    orbitRing.rotation.x = Math.PI / 2.2
    planetGroup.add(orbitRing)

    if (hasRings) {
      const saturnRingGeo = new THREE.RingGeometry(radius * 1.3, radius * 2.3, 64)
      const ringTex = createSaturnRingTexture()
      const saturnRingMat = new THREE.MeshStandardMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      const saturnRings = new THREE.Mesh(saturnRingGeo, saturnRingMat)
      saturnRings.rotation.x = Math.PI / 2.2
      planetGroup.add(saturnRings)
    }

    scene.add(planetGroup)

    // 2. Spacecraft Model Group
    const craftGroup = new THREE.Group()

    // Spacecraft Bus Mesh
    const busGeo = new THREE.CylinderGeometry(1.5, 1.5, 2.4, 8)
    const busMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.25 })
    const busMesh = new THREE.Mesh(busGeo, busMat)
    craftGroup.add(busMesh)

    // Solar panels if selected
    if (selectedIds.includes('solar')) {
      const panelGeo = new THREE.BoxGeometry(3.6, 0.06, 1.4)
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x104080, metalness: 0.8, roughness: 0.2 })
      const leftPanel = new THREE.Mesh(panelGeo, panelMat)
      leftPanel.position.set(-3.2, 0, 0)
      const rightPanel = new THREE.Mesh(panelGeo, panelMat)
      rightPanel.position.set(3.2, 0, 0)
      craftGroup.add(leftPanel)
      craftGroup.add(rightPanel)
    }

    // High gain antenna dish
    if (selectedIds.includes('antenna')) {
      const dishGeo = new THREE.CylinderGeometry(1.2, 0.15, 0.4, 16, 1, true)
      const dishMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.7, side: THREE.DoubleSide })
      const dish = new THREE.Mesh(dishGeo, dishMat)
      dish.rotation.x = Math.PI / 3
      dish.position.set(0, 1.5, 0)
      craftGroup.add(dish)
    }

    // Plasma Thruster Flame Jet FX
    const jetGeo = new THREE.ConeGeometry(0.6, 2.5, 16, 1, true)
    const jetMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 })
    const plasmaJet = new THREE.Mesh(jetGeo, jetMat)
    plasmaJet.position.y = -2.2
    plasmaJet.rotation.x = Math.PI
    craftGroup.add(plasmaJet)

    // Science Scan Cone FX (Active when camera/spectrometer instruments present)
    const scanGeo = new THREE.ConeGeometry(2.0, 12, 16, 1, true)
    const scanMat = new THREE.MeshBasicMaterial({ color: 0xa9e874, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
    const scanCone = new THREE.Mesh(scanGeo, scanMat)
    scanCone.position.set(0, -6, 0)
    scanCone.rotation.x = Math.PI
    craftGroup.add(scanCone)

    scene.add(craftGroup)

    // 3. Crisis Particles (Dust storm or Solar Flare particle cloud)
    const crisisParticleCount = 800
    const crisisGeom = new THREE.BufferGeometry()
    const crisisPos = new Float32Array(crisisParticleCount * 3)
    for (let i = 0; i < crisisParticleCount * 3; i++) {
      crisisPos[i] = (Math.random() - 0.5) * 400
    }
    crisisGeom.setAttribute('position', new THREE.BufferAttribute(crisisPos, 3))
    const crisisMat = new THREE.PointsMaterial({ color: 0xff3300, size: 3.0, transparent: true, opacity: 0.0 })
    const crisisCloud = new THREE.Points(crisisGeom, crisisMat)
    scene.add(crisisCloud)

    // Orbit Animation Logic
    const clock = new THREE.Clock()
    let reqId: number

    // Interactive mouse rotation for Free camera
    let isDragging = false
    let prevMouseX = 0
    let prevMouseY = 0

    const container = mountRef.current

    function onMouseDown(e: MouseEvent) {
      if (cameraMode !== 'free') return
      isDragging = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDragging || cameraMode !== 'free') return
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

    function animate() {
      reqId = requestAnimationFrame(animate)
      const totalTime = clock.getElapsedTime()

      // Orbital revolution of spacecraft around destination
      const angle = totalTime * 0.25
      const craftX = Math.cos(angle) * orbitRadius
      const craftZ = Math.sin(angle) * orbitRadius
      craftGroup.position.set(craftX, 0, craftZ)
      craftGroup.rotation.y = -angle + Math.PI / 2

      // Animate thruster pulse glow
      jetMat.opacity = 0.5 + Math.sin(totalTime * 12) * 0.35

      // Animate science scan cone sweep pulse
      const hasInstruments = selectedIds.includes('camera') || selectedIds.includes('spectrometer') || selectedIds.includes('drill')
      scanCone.visible = hasInstruments
      scanMat.opacity = hasInstruments ? 0.12 + Math.sin(totalTime * 4) * 0.1 : 0.0

      // Animate crisis particles
      crisisMat.opacity = isCrisis ? 0.75 + Math.sin(totalTime * 5) * 0.2 : 0.0
      if (isCrisis) {
        crisisCloud.rotation.y += 0.01
      }

      // Planet ambient spin
      planetMesh.rotation.y += 0.005
      stars.rotation.y += 0.0005

      // Camera mode updates
      if (cameraMode === 'chase') {
        // Follow behind spacecraft
        const camOffset = new THREE.Vector3(-Math.cos(angle - 0.4) * (orbitRadius + 45), 25, -Math.sin(angle - 0.4) * (orbitRadius + 45))
        camera.position.copy(camOffset)
        camera.lookAt(craftGroup.position)
      } else if (cameraMode === 'orbit') {
        // High planetary orbit overview
        camera.position.set(0, orbitRadius * 1.6, orbitRadius * 1.8)
        camera.lookAt(planetGroup.position)
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
      busGeo.dispose()
      busMat.dispose()
      jetGeo.dispose()
      jetMat.dispose()
      scanGeo.dispose()
      scanMat.dispose()
      renderer.dispose()
    }
  }, [destination, selectedIds, isCrisis, cameraMode])

  const speedKmS = Math.round(11.2 + (totals.science * 0.1))
  const altitudeKm = Math.round(450 - (elapsedSeconds * 2))

  return (
    <div className={className ?? 'interactive-simulation-3d-wrapper'} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: cameraMode === 'free' ? 'grab' : 'default' }} />

      {/* 3D Telemetry HUD Overlay */}
      <div className="sim-3d-hud" style={{ position: 'absolute', top: '15px', left: '15px', pointerEvents: 'none', background: 'rgba(5,10,18,0.75)', border: '1px solid rgba(169,232,116,0.3)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.8rem', color: '#e0e0e0', backdropFilter: 'blur(4px)' }}>
        <div style={{ fontSize: '0.7rem', color: '#a9e874', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
          3D FLIGHT TELEMETRY HUD
        </div>
        <div>ORBITAL VELOCITY: <strong style={{ color: '#ffffff' }}>{speedKmS} km/s</strong></div>
        <div>ALTITUDE: <strong style={{ color: '#ffffff' }}>{altitudeKm} km</strong></div>
        <div>SOLAR POWER OUTPUT: <strong style={{ color: '#a9e874' }}>{totals.powerSupply} W</strong></div>
        <div>COMMUNICATIONS LINK: <strong style={{ color: '#4488ff' }}>{totals.communications} dB</strong></div>
      </div>

      {/* Camera Mode Selector */}
      <div className="sim-3d-camera-bar" style={{ position: 'absolute', bottom: '15px', right: '15px', display: 'flex', gap: '8px', zIndex: 10 }}>
        <button
          className={`button button--quiet ${cameraMode === 'chase' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setCameraMode('chase')}
          style={{ background: cameraMode === 'chase' ? '#a9e874' : 'rgba(0,0,0,0.6)', color: cameraMode === 'chase' ? '#000' : '#fff', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px' }}
        >
          📷 Chase Cam
        </button>
        <button
          className={`button button--quiet ${cameraMode === 'orbit' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setCameraMode('orbit')}
          style={{ background: cameraMode === 'orbit' ? '#a9e874' : 'rgba(0,0,0,0.6)', color: cameraMode === 'orbit' ? '#000' : '#fff', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px' }}
        >
          🌐 Orbit Cam
        </button>
        <button
          className={`button button--quiet ${cameraMode === 'free' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setCameraMode('free')}
          style={{ background: cameraMode === 'free' ? '#a9e874' : 'rgba(0,0,0,0.6)', color: cameraMode === 'free' ? '#000' : '#fff', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px' }}
        >
          🖐️ Free System
        </button>
      </div>
    </div>
  )
}
