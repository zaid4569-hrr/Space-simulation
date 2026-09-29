import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface SpacecraftBuilder3DProps {
  selectedIds: readonly string[]
  className?: string
}

/**
 * Interactive 3D spacecraft part assembly viewport.
 * Dynamically constructs 3D spacecraft geometry based on active selected equipment IDs.
 */
export function SpacecraftBuilder3D({ selectedIds, className }: SpacecraftBuilder3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x05080e, 0.002)

    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000)
    camera.position.set(0, 8, 22)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x070a10, 1)

    mountRef.current.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(0xa9e874, 1.8)
    dirLight1.position.set(10, 15, 12)
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0x4488ff, 1.2)
    dirLight2.position.set(-10, -5, -10)
    scene.add(dirLight2)

    // Grid floor for engineering deck look
    const gridHelper = new THREE.GridHelper(25, 25, 0xa9e874, 0x1c2b36)
    gridHelper.position.y = -4
    scene.add(gridHelper)

    // Master spacecraft group
    const craftGroup = new THREE.Group()
    scene.add(craftGroup)

    // --- 1. CORE BUS (Base Octagonal Structure) ---
    if (selectedIds.includes('bus')) {
      const busGeo = new THREE.CylinderGeometry(2.2, 2.2, 3.5, 8)
      // Gold foil thermal insulation texture
      const busMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.9,
        roughness: 0.25,
        wireframe: false,
      })
      const busMesh = new THREE.Mesh(busGeo, busMat)
      craftGroup.add(busMesh)

      // Main thruster nozzle at base
      const nozzleGeo = new THREE.ConeGeometry(0.8, 1.2, 16, 1, true)
      const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.4 })
      const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat)
      nozzle.position.y = -2.35
      nozzle.rotation.x = Math.PI
      craftGroup.add(nozzle)

      // Reaction wheels / avionics ring
      const ringGeo = new THREE.TorusGeometry(2.3, 0.15, 8, 24)
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = Math.PI / 2
      craftGroup.add(ringMesh)
    }

    // --- 2. DEPLOYABLE SOLAR ARRAY ---
    if (selectedIds.includes('solar')) {
      const arrayGroup = new THREE.Group()

      // Left panel
      const panelGeo = new THREE.BoxGeometry(4.5, 0.08, 1.8)
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x104080, roughness: 0.2, metalness: 0.8 })
      const leftPanel = new THREE.Mesh(panelGeo, panelMat)
      leftPanel.position.set(-4.5, 0, 0)
      arrayGroup.add(leftPanel)

      // Right panel
      const rightPanel = new THREE.Mesh(panelGeo, panelMat)
      rightPanel.position.set(4.5, 0, 0)
      arrayGroup.add(rightPanel)

      // Metallic mounting booms
      const boomGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.5)
      const boomMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 })
      const leftBoom = new THREE.Mesh(boomGeo, boomMat)
      leftBoom.rotation.z = Math.PI / 2
      leftBoom.position.set(-1.8, 0, 0)
      arrayGroup.add(leftBoom)

      const rightBoom = new THREE.Mesh(boomGeo, boomMat)
      rightBoom.rotation.z = Math.PI / 2
      rightBoom.position.set(1.8, 0, 0)
      arrayGroup.add(rightBoom)

      craftGroup.add(arrayGroup)
    }

    // --- 3. RADIOISOTOPE THERMOELECTRIC GENERATOR (RTG) ---
    if (selectedIds.includes('rtg')) {
      const rtgGroup = new THREE.Group()

      const rtgCylinderGeo = new THREE.CylinderGeometry(0.7, 0.7, 2.2, 16)
      const rtgMat = new THREE.MeshStandardMaterial({ color: 0x4a4e69, metalness: 0.8, roughness: 0.3 })
      const rtgCylinder = new THREE.Mesh(rtgCylinderGeo, rtgMat)

      // Cooling fins
      const finGeo = new THREE.BoxGeometry(2.0, 1.8, 0.06)
      const finMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 })
      const fins1 = new THREE.Mesh(finGeo, finMat)
      const fins2 = new THREE.Mesh(finGeo, finMat)
      fins2.rotation.y = Math.PI / 2

      rtgGroup.add(rtgCylinder)
      rtgGroup.add(fins1)
      rtgGroup.add(fins2)

      // Position on lower side boom
      rtgGroup.position.set(0, -1.2, 2.4)
      craftGroup.add(rtgGroup)
    }

    // --- 4. HIGH-GAIN ANTENNA DISH ---
    if (selectedIds.includes('antenna')) {
      const antennaGroup = new THREE.Group()

      // Dish dish shape (inverted truncated cone / sphere segment)
      const dishGeo = new THREE.CylinderGeometry(1.8, 0.2, 0.6, 24, 1, true)
      const dishMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide })
      const dish = new THREE.Mesh(dishGeo, dishMat)
      dish.rotation.x = Math.PI / 3

      // Feed horn sub-reflector stem
      const feedGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2)
      const feedMat = new THREE.MeshStandardMaterial({ color: 0xa9e874, metalness: 0.8 })
      const feed = new THREE.Mesh(feedGeo, feedMat)
      feed.position.set(0, 0.4, 0.3)

      antennaGroup.add(dish)
      antennaGroup.add(feed)

      antennaGroup.position.set(0, 2.3, 0)
      craftGroup.add(antennaGroup)
    }

    // --- 5. CONTEXT CAMERA ---
    if (selectedIds.includes('camera')) {
      const camGroup = new THREE.Group()

      const lensBodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 16)
      const lensMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 })
      const lensBody = new THREE.Mesh(lensBodyGeo, lensMat)
      lensBody.rotation.x = Math.PI / 2

      // Sapphire lens element glow
      const glassGeo = new THREE.SphereGeometry(0.3, 16, 16)
      const glassMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.8 })
      const glass = new THREE.Mesh(glassGeo, glassMat)
      glass.position.z = 0.45

      camGroup.add(lensBody)
      camGroup.add(glass)

      camGroup.position.set(1.4, 1.0, 1.4)
      craftGroup.add(camGroup)
    }

    // --- 6. MINERAL SPECTROMETER ---
    if (selectedIds.includes('spectrometer')) {
      const specGroup = new THREE.Group()

      const boxGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2)
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x3a5a40, metalness: 0.5, roughness: 0.4 })
      const box = new THREE.Mesh(boxGeo, boxMat)

      const apertureGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.2, 12)
      const apertureMat = new THREE.MeshBasicMaterial({ color: 0xa9e874 })
      const aperture = new THREE.Mesh(apertureGeo, apertureMat)
      aperture.rotation.x = Math.PI / 2
      aperture.position.z = 0.6

      specGroup.add(box)
      specGroup.add(aperture)

      specGroup.position.set(-1.4, 1.0, 1.4)
      craftGroup.add(specGroup)
    }

    // --- 7. SAMPLE DRILL ---
    if (selectedIds.includes('drill')) {
      const drillGroup = new THREE.Group()

      const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.8)
      const armMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.9 })
      const arm = new THREE.Mesh(armGeo, armMat)
      arm.position.y = -0.9

      const bitGeo = new THREE.ConeGeometry(0.2, 0.8, 12)
      const bitMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 1.0, roughness: 0.1 })
      const bit = new THREE.Mesh(bitGeo, bitMat)
      bit.position.y = -1.9
      bit.rotation.x = Math.PI

      drillGroup.add(arm)
      drillGroup.add(bit)

      drillGroup.position.set(0, -1.2, -2.0)
      craftGroup.add(drillGroup)
    }

    // Interactive mouse rotation controls
    let isDragging = false
    let prevMouseX = 0
    let prevMouseY = 0

    const container = mountRef.current

    function onMouseDown(e: MouseEvent) {
      isDragging = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDragging) return
      const deltaX = e.clientX - prevMouseX
      const deltaY = e.clientY - prevMouseY

      craftGroup.rotation.y += deltaX * 0.008
      craftGroup.rotation.x += deltaY * 0.008

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

      // Idle auto-rotation when user is not dragging
      if (!isDragging) {
        craftGroup.rotation.y += delta * 0.3
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
      renderer.dispose()
    }
  }, [selectedIds])

  return (
    <div className={className ?? 'spacecraft-builder-3d-wrapper'} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
      <div className="builder-3d-hint" style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', color: '#a9e874', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', pointerEvents: 'none' }}>
        <span>3D VIEWPORT · Drag to rotate spacecraft</span>
      </div>
    </div>
  )
}
