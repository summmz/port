import { useMemo } from 'react'
import * as THREE from 'three'
import { Grid, MeshReflectorMaterial } from '@react-three/drei'

/** Radial alpha mask so the floor dissolves into the void smoothly at the perimeter */
function useFadeTexture() {
  return useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, 'rgba(4, 4, 7, 0)')
    grad.addColorStop(0.5, 'rgba(4, 4, 7, 0.15)')
    grad.addColorStop(1, 'rgba(4, 4, 7, 0.88)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}

interface MirrorFloorProps {
  resolution?: number
}

/**
 * Glossy Mirror Floor Plane (Real-Time Reflections):
 * Acts as a dark obsidian glass surface reflecting every glowing hologram,
 * floating billboard card, cyber ring, and light element with realistic
 * blur, depth falloff, roughness, and fresnel sheen.
 */
export function MirrorFloor({ resolution = 512 }: MirrorFloorProps) {
  const fade = useFadeTexture()

  return (
    <group position={[0, 0, 0]}>
      {/* Real-time glossy reflector floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[80, 80]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={resolution}
          mirror={0.8}
          mixBlur={0.85}
          mixStrength={3.2}
          roughness={0.38}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050912"
          metalness={0.88}
        />
      </mesh>

      {/* Cyberpunk Technical grid in electric blue & cyan tones */}
      <Grid
        position={[0, 0.002, 0]}
        args={[80, 80]}
        cellSize={0.6}
        cellThickness={0.6}
        cellColor="#051a2e"
        sectionSize={3}
        sectionThickness={1.2}
        sectionColor="#0a3366"
        fadeDistance={55}
        fadeStrength={1.8}
        followCamera={false}
        infiniteGrid={false}
      />

      {/* Perimeter Vignette mask over the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[70, 70]} />
        <meshBasicMaterial map={fade} transparent depthWrite={false} opacity={0.6} />
      </mesh>
    </group>
  )
}