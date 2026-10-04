import { useMemo, useRef, useState } from 'react'
import { Billboard } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { SectionId } from '../content'
import { palette } from '../theme'

interface Props {
  id: SectionId
  label: string
  kanji?: string
  position: [number, number]
  onNavigate: (id: SectionId) => void
  anySelected?: boolean
}

function useWaypointTexture(label: string, kanji: string) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 160
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 512, 160)

    ctx.fillStyle = 'rgba(7, 8, 13, 0.94)'
    ctx.fillRect(0, 0, 512, 160)

    ctx.strokeStyle = '#0088ff'
    ctx.lineWidth = 4
    ctx.strokeRect(4, 4, 504, 152)

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 48px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label.toUpperCase(), 256, 56)

    ctx.fillStyle = '#0088ff'
    ctx.font = '600 32px sans-serif'
    ctx.fillText(`[ ${kanji} // WAYPOINT ]`, 256, 114)

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [label, kanji])
}

export function FloorNode({ id, label, kanji = '拠点', position, onNavigate, anySelected = false }: Props) {
  const [hovered, setHovered] = useState(false)
  const { size } = useThree()
  const isMobile = size.width < 768
  const ringRef = useRef<THREE.Mesh>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const tex = useWaypointTexture(label, kanji)

  // Rings sit at Y=0.2 — well above the floor plane (y=0) and grid (y=0.002),
  // so there is physically no geometry to z-fight with. No tricks needed.
  const RING_Y = 0.2

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (hovered ? 1.8 : 0.5)
    }

    if (coreRef.current) {
      const s = 1 + Math.sin(t * 2.4) * 0.14
      coreRef.current.scale.setScalar(s)
    }
  })

  const [x, z] = position

  if (anySelected) return null

  return (
    <group position={[x, 0, z]}>
      {/* Invisible click target — flat is fine since it has no material to glitch */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = '' }}
        onClick={(e) => { e.stopPropagation(); onNavigate(id) }}
        frustumCulled={false}
      >
        <circleGeometry args={[0.9, 32]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Outer rotating ring — Y=0.2 floats cleanly above the floor */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, RING_Y, 0]}
        frustumCulled={false}
      >
        <torusGeometry args={[0.58, 0.028, 8, 64]} />
        <meshBasicMaterial
          color={hovered ? palette.cyan : palette.accent}
          transparent
          opacity={hovered ? 1.0 : 0.75}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Inner radar ring */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, RING_Y - 0.01, 0]}
        frustumCulled={false}
      >
        <torusGeometry args={[0.35, 0.014, 8, 48]} />
        <meshBasicMaterial
          color={palette.cyan}
          transparent
          opacity={hovered ? 0.9 : 0.5}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Core dot */}
      <mesh
        ref={coreRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, RING_Y - 0.02, 0]}
        frustumCulled={false}
      >
        <circleGeometry args={[0.1, 24]} />
        <meshBasicMaterial
          color={hovered ? '#ffffff' : palette.accent}
          transparent
          opacity={0.95}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Crosshair H */}
      <mesh position={[0, RING_Y - 0.03, 0]} frustumCulled={false}>
        <boxGeometry args={[1.3, 0.014, 0.006]} />
        <meshBasicMaterial
          color={palette.accent}
          transparent
          opacity={hovered ? 0.85 : 0.3}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Crosshair V */}
      <mesh position={[0, RING_Y - 0.03, 0]} frustumCulled={false}>
        <boxGeometry args={[0.006, 0.014, 1.3]} />
        <meshBasicMaterial
          color={palette.accent}
          transparent
          opacity={hovered ? 0.85 : 0.3}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Floating billboard label - only on desktop to keep mobile screen completely clean & uncluttered */}
      {!isMobile && (
        <Billboard position={[0, 0.65, 0]}>
          <group
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = '' }}
            onClick={(e) => { e.stopPropagation(); onNavigate(id) }}
          >
            <mesh frustumCulled={false}>
              <planeGeometry args={[1.35, 0.42]} />
              <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
            </mesh>
          </group>
        </Billboard>
      )}
    </group>
  )
}