import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { palette } from '../theme'

/** Deterministic pseudo-random number generator */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Distant cyber monoliths / server towers for architectural depth */
function CyberMonoliths() {
  const monoliths = useMemo(() => {
    const data = [
      { pos: [-16, 7, -18], scale: [1.8, 14, 1.4], color: palette.accent },
      { pos: [-11, 8.5, -23], scale: [2.2, 17, 1.6], color: palette.cyan },
      { pos: [-6, 6, -28], scale: [1.6, 12, 1.2], color: palette.accent },
      { pos: [-1.5, 9, -32], scale: [2.4, 18, 1.8], color: palette.accentDim },
      { pos: [3.5, 7.5, -30], scale: [1.9, 15, 1.4], color: palette.cyan },
      { pos: [8.5, 9.5, -25], scale: [2.5, 19, 1.8], color: palette.accent },
      { pos: [13.5, 8, -20], scale: [2.0, 16, 1.5], color: palette.accentDim },
      { pos: [18, 6.5, -16], scale: [1.7, 13, 1.3], color: palette.cyan },
      // Side flankers for wide framing
      { pos: [-22, 5.5, -12], scale: [1.6, 11, 1.2], color: palette.accentDim },
      { pos: [22, 5.5, -12], scale: [1.6, 11, 1.2], color: palette.accentDim },
    ]
    return data
  }, [])

  return (
    <group>
      {monoliths.map((m, i) => (
        <group key={i} position={m.pos as [number, number, number]}>
          {/* Main dark tower block */}
          <mesh>
            <boxGeometry args={m.scale as [number, number, number]} />
            <meshStandardMaterial
              color="#07070c"
              roughness={0.85}
              metalness={0.9}
            />
          </mesh>

          {/* Wireframe edge cage */}
          <mesh>
            <boxGeometry args={[m.scale[0] + 0.02, m.scale[1] + 0.02, m.scale[2] + 0.02]} />
            <meshBasicMaterial
              color="#081a2a"
              wireframe
              transparent
              opacity={0.5}
            />
          </mesh>

          {/* Glowing vertical LED light strip on tower face */}
          <mesh position={[0, 0, m.scale[2] / 2 + 0.015]}>
            <planeGeometry args={[0.045, m.scale[1] * 0.85]} />
            <meshBasicMaterial
              color={m.color}
              transparent
              opacity={0.8}
              toneMapped={false}
            />
          </mesh>

          {/* Horizontal server activity indicator ticks */}
          <mesh position={[0, m.scale[1] * 0.25, m.scale[2] / 2 + 0.018]}>
            <planeGeometry args={[m.scale[0] * 0.55, 0.03]} />
            <meshBasicMaterial
              color={palette.accent}
              transparent
              opacity={0.85}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, -m.scale[1] * 0.15, m.scale[2] / 2 + 0.018]}>
            <planeGeometry args={[m.scale[0] * 0.4, 0.03]} />
            <meshBasicMaterial
              color={palette.cyan}
              transparent
              opacity={0.75}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Grand rotating cybernetic halo / gyro ring system in distant horizon */
function CyberHorizonRing() {
  const outerRing = useRef<THREE.Group>(null)
  const innerRing = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (outerRing.current) {
      outerRing.current.rotation.z = t * 0.04
      outerRing.current.rotation.y = Math.sin(t * 0.08) * 0.2
    }
    if (innerRing.current) {
      innerRing.current.rotation.x = -t * 0.06
      innerRing.current.rotation.z = Math.cos(t * 0.05) * 0.25
    }
    if (core.current) {
      core.current.rotation.y += delta * 0.35
      core.current.rotation.x += delta * 0.2
    }
  })

  return (
    <group position={[0, 6.2, -30]}>
      {/* Outer primary neon ring */}
      <group ref={outerRing}>
        <mesh>
          <torusGeometry args={[8.5, 0.038, 16, 80]} />
          <meshBasicMaterial
            color={palette.accent}
            transparent
            opacity={0.85}
            toneMapped={false}
          />
        </mesh>
        {/* Tick segments around outer ring */}
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <ringGeometry args={[8.2, 8.8, 4, 1, 0, 0.2]} />
          <meshBasicMaterial
            color={palette.cyan}
            transparent
            opacity={0.7}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 3]}>
          <ringGeometry args={[8.2, 8.8, 4, 1, 0, 0.2]} />
          <meshBasicMaterial
            color={palette.cyan}
            transparent
            opacity={0.7}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Middle tilted neon ring */}
      <group ref={innerRing} rotation={[0.4, 0.3, 0]}>
        <mesh>
          <torusGeometry args={[6.2, 0.028, 16, 64]} />
          <meshBasicMaterial
            color={palette.cyan}
            transparent
            opacity={0.75}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Inner data core spinning slowly */}
      <mesh ref={core}>
        <icosahedronGeometry args={[1.2, 0]} />
        <meshBasicMaterial
          color={palette.accent}
          wireframe
          transparent
          opacity={0.4}
          toneMapped={false}
        />
      </mesh>

      {/* Soft atmospheric halo glow disc */}
      <mesh position={[0, 0, -0.5]}>
        <circleGeometry args={[9.5, 48]} />
        <meshBasicMaterial
          color="#060e22"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/** Floating geometric data artifacts drifting through mid-air */
function FloatingArtifacts() {
  const group = useRef<THREE.Group>(null)

  const items = useMemo(() => [
    { pos: [-9.5, 5.2, -4], type: 'octa', scale: 0.55, rotSpeed: [0.3, 0.5, 0.2] },
    { pos: [10.2, 4.8, -3], type: 'ico', scale: 0.65, rotSpeed: [-0.4, 0.3, 0.25] },
    { pos: [-5.8, 7.0, -9], type: 'tetra', scale: 0.5, rotSpeed: [0.5, -0.4, 0.3] },
    { pos: [6.4, 6.5, -8], type: 'octa', scale: 0.6, rotSpeed: [-0.3, 0.4, -0.3] },
  ], [])

  const meshes = useRef<THREE.Mesh[]>([])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    meshes.current.forEach((mesh, i) => {
      if (!mesh) return
      const item = items[i]
      mesh.rotation.x += delta * item.rotSpeed[0]
      mesh.rotation.y += delta * item.rotSpeed[1]
      mesh.rotation.z += delta * item.rotSpeed[2]
      mesh.position.y = item.pos[1] + Math.sin(t * 0.7 + i * 1.5) * 0.25
    })
  })

  return (
    <group ref={group}>
      {items.map((item, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) meshes.current[i] = el }}
          position={item.pos as [number, number, number]}
          scale={item.scale}
        >
          {item.type === 'octa' ? (
            <octahedronGeometry args={[1, 0]} />
          ) : item.type === 'ico' ? (
            <icosahedronGeometry args={[1, 0]} />
          ) : (
            <tetrahedronGeometry args={[1, 0]} />
          )}
          <meshBasicMaterial
            color={i % 2 === 0 ? palette.accent : palette.cyan}
            wireframe
            transparent
            opacity={0.55}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/** Upward-rising energized cyber embers */
function EnergyEmbers({ count = 180 }: { count?: number }) {
  const points = useRef<THREE.Points>(null)
  const { positions, velocities } = useMemo(() => {
    const rand = mulberry32(4242)
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (rand() - 0.5) * 32
      pos[i * 3 + 1] = rand() * 12
      pos[i * 3 + 2] = (rand() - 0.5) * 28 - 2
      vel[i]         = 0.3 + rand() * 0.7
    }
    return { positions: pos, velocities: vel }
  }, [count])

  useFrame((_, delta) => {
    if (!points.current) return
    const posAttr = points.current.geometry.attributes.position as THREE.BufferAttribute
    const array = posAttr.array as Float32Array

    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] += velocities[i] * delta * 1.2
      // Reset if risen too high
      if (array[i * 3 + 1] > 14) {
        array[i * 3 + 1] = 0.05
      }
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={palette.accent}
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  )
}

/** Glowing horizon light strip at the boundary of grid and sky */
function HorizonGlow() {
  return (
    <group position={[0, 0.4, -36]}>
      {/* Horizontal laser beam across horizon */}
      <mesh>
        <planeGeometry args={[70, 0.05]} />
        <meshBasicMaterial
          color={palette.accent}
          transparent
          opacity={0.8}
          toneMapped={false}
        />
      </mesh>
      {/* Soft gradient haze along horizon */}
      <mesh position={[0, 1.2, -0.1]}>
        <planeGeometry args={[70, 3.2]} />
        <meshBasicMaterial
          color="#061c36"
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export function CyberEnvironment() {
  return (
    <group>
      <CyberMonoliths />
      <CyberHorizonRing />
      <FloatingArtifacts />
      <EnergyEmbers />
      <HorizonGlow />
    </group>
  )
}
