import { useEffect, useMemo, useRef, useState } from 'react'
import { Billboard } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { HubCard } from '../content'
import { palette } from '../theme'
import { useCardTexture, useFallbackTexture } from './cardTexture'
import { swipeLockRef } from '../lib/swipeLock'

const WIDTH = 3.2
const HEIGHT = 1.95
const CENTRE_Y = 2.35
const noRaycast = () => null

interface Props {
  card: HubCard
  index: number
  selected: boolean
  anySelected: boolean
  onSelect: (id: HubCard['id'] | null) => void
}

/** Rotating Orbital Data Rings with dynamic 6DOF mouse parallax */
function OrbitalDataRings({
  active,
  pointer,
}: {
  active: boolean
  pointer: THREE.Vector2
}) {
  const outerRing = useRef<THREE.Group>(null)
  const innerRing = useRef<THREE.Group>(null)
  const reticleRing = useRef<THREE.Group>(null)
  const parallaxGroup = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!active) return
    const dt = Math.min(delta, 0.05)

    if (outerRing.current) {
      outerRing.current.rotation.z += dt * 0.45
    }
    if (innerRing.current) {
      innerRing.current.rotation.x += dt * 0.6
      innerRing.current.rotation.y += dt * 0.35
    }
    if (reticleRing.current) {
      reticleRing.current.rotation.z -= dt * 0.3
    }

    // Dynamic 6DOF Parallax offset on orbital rings
    if (parallaxGroup.current) {
      parallaxGroup.current.rotation.y = THREE.MathUtils.damp(
        parallaxGroup.current.rotation.y,
        pointer.x * 0.3,
        6.0,
        dt,
      )
      parallaxGroup.current.rotation.x = THREE.MathUtils.damp(
        parallaxGroup.current.rotation.x,
        -pointer.y * 0.22,
        6.0,
        dt,
      )
    }
  })

  if (!active) return null

  return (
    <group ref={parallaxGroup} position={[0, 0, -0.15]}>
      {/* Outer spinning neon ring with tick markers */}
      <group ref={outerRing}>
        <mesh>
          <ringGeometry args={[2.85, 2.92, 64]} />
          <meshBasicMaterial
            color={palette.cyan}
            transparent
            opacity={0.85}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* 4 Quadrant reticle nodes */}
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, i) => (
          <mesh
            key={i}
            position={[Math.cos(angle) * 2.88, Math.sin(angle) * 2.88, 0]}
          >
            <circleGeometry args={[0.075, 16]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* Inner tilted 3D orbital gyro ring */}
      <group ref={innerRing} rotation={[0.4, 0.3, 0]}>
        <mesh>
          <torusGeometry args={[3.2, 0.018, 16, 80]} />
          <meshBasicMaterial
            color={palette.accent}
            transparent
            opacity={0.7}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Reticle dashed ring */}
      <group ref={reticleRing}>
        <mesh>
          <ringGeometry args={[3.45, 3.48, 48]} />
          <meshBasicMaterial
            color={palette.cyan}
            transparent
            opacity={0.45}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  )
}

/** 4 Corner laser projection beams casting pulsing shockwaves on mirror floor */
function CornerLaserBeams({ active }: { active: boolean }) {
  const ripple1 = useRef<THREE.Mesh>(null)
  const ripple2 = useRef<THREE.Mesh>(null)
  const ripple3 = useRef<THREE.Mesh>(null)
  const ripple4 = useRef<THREE.Mesh>(null)
  const group = useRef<THREE.Group>(null)

  const beamHeight = 2.45
  const halfW = (WIDTH * 1.68) / 2 - 0.15
  const halfH = (HEIGHT * 1.68) / 2 - 0.15

  const corners: [number, number][] = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [-halfW, halfH],
    [halfW, halfH],
  ]

  useFrame((state, delta) => {
    if (!active) return
    const t = state.clock.elapsedTime
    const dt = Math.min(delta, 0.05)

    // Pulsing shockwaves on the floor
    const ripples = [ripple1.current, ripple2.current, ripple3.current, ripple4.current]
    ripples.forEach((mesh, idx) => {
      if (!mesh) return
      const scale = 1 + (Math.sin(t * 4.5 + idx * 1.2) * 0.5 + 0.5) * 0.8
      mesh.scale.set(scale, scale, 1)
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.opacity = THREE.MathUtils.damp(
        mat.opacity,
        0.7 - (scale - 1) * 0.45,
        10,
        dt,
      )
    })
  })

  if (!active) return null

  return (
    <group ref={group}>
      {corners.map(([cx, cy], i) => (
        <group key={i} position={[cx, cy, 0]}>
          {/* Vertical laser beam down to floor */}
          <mesh position={[0, -beamHeight / 2, 0]}>
            <cylinderGeometry args={[0.008, 0.018, beamHeight, 12]} />
            <meshBasicMaterial
              color={palette.cyan}
              transparent
              opacity={0.45}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* Floor contact ripple ring */}
          <mesh
            ref={i === 0 ? ripple1 : i === 1 ? ripple2 : i === 2 ? ripple3 : ripple4}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -beamHeight + 0.015, 0]}
          >
            <ringGeometry args={[0.08, 0.28, 24]} />
            <meshBasicMaterial
              color={palette.cyan}
              transparent
              opacity={0.6}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Central floor alignment beacon reticle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -beamHeight + 0.012, 0]}>
        <ringGeometry args={[1.4, 1.55, 48]} />
        <meshBasicMaterial
          color={palette.cyan}
          transparent
          opacity={0.7}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

/** Particle energy burst that blooms outward when entering portal view */
function DimensionBurstParticles({ active }: { active: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 75

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 3.5
      pos[i * 3] = (Math.random() - 0.5) * 1.5
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.2
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5

      vel[i * 3] = Math.cos(angle) * speed
      vel[i * 3 + 1] = Math.sin(angle) * speed + 0.5
      vel[i * 3 + 2] = (Math.random() - 0.5) * speed
    }
    return { positions: pos, velocities: vel }
  }, [count])

  const [burstLife, setBurstLife] = useState(0)

  useEffect(() => {
    if (active) {
      setBurstLife(1.0)
    }
  }, [active])

  useFrame((_, delta) => {
    if (!active || burstLife <= 0 || !pointsRef.current) return
    const dt = Math.min(delta, 0.05)
    setBurstLife((life) => Math.max(0, life - dt * 0.75))

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array

    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3] * dt
      arr[i * 3 + 1] += velocities[i * 3 + 1] * dt
      arr[i * 3 + 2] += velocities[i * 3 + 2] * dt
    }
    posAttr.needsUpdate = true

    const pMat = pointsRef.current.material as THREE.PointsMaterial
    pMat.opacity = burstLife * 0.8
  })

  if (!active || burstLife <= 0.01) return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={palette.cyan}
        size={0.065}
        sizeAttenuation
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  )
}

export function ProjectCard({ card, index, selected, anySelected, onSelect }: Props) {
  const texture = useCardTexture(card)
  const fallback = useFallbackTexture()
  const { pointer } = useThree()
  const [hovered, setHovered] = useState(false)

  const rootGroup = useRef<THREE.Group>(null)
  const cardBillboard = useRef<THREE.Group>(null)
  const borderMat = useRef<THREE.MeshBasicMaterial>(null)
  const haloMat = useRef<THREE.MeshBasicMaterial>(null)
  const ring = useRef<THREE.Mesh>(null)

  const lift = CENTRE_Y

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    // 1. Spatial Dimension Shift Targets
    const targetX = selected ? 0 : anySelected ? card.position[0] * 1.6 : card.position[0]
    const targetY = selected ? 2.45 : anySelected ? 1.6 : lift
    const targetZ = selected ? 6.2 : anySelected ? card.position[1] - 8.5 : card.position[1]

    const targetScale = selected ? 1.68 : anySelected ? 0.65 : hovered ? 1.06 : 1.0
    const targetOpacity = selected ? 1.0 : anySelected ? 0.06 : hovered ? 0.9 : 0.5

    const bob = anySelected ? 0 : Math.sin(t * 0.9 + index * 1.5) * 0.08

    if (rootGroup.current) {
      rootGroup.current.position.x = THREE.MathUtils.damp(rootGroup.current.position.x, targetX, 5.5, dt)
      rootGroup.current.position.y = THREE.MathUtils.damp(rootGroup.current.position.y, targetY + bob, 5.5, dt)
      rootGroup.current.position.z = THREE.MathUtils.damp(rootGroup.current.position.z, targetZ, 5.5, dt)

      rootGroup.current.scale.x = THREE.MathUtils.damp(rootGroup.current.scale.x, targetScale, 6.0, dt)
      rootGroup.current.scale.y = rootGroup.current.scale.x
      rootGroup.current.scale.z = rootGroup.current.scale.x
    }

    // 2. 6DOF Dynamic Holographic Tilt on the Card
    if (cardBillboard.current) {
      const targetRotY = selected ? pointer.x * 0.16 : 0
      const targetRotX = selected ? -pointer.y * 0.12 : 0
      cardBillboard.current.rotation.y = THREE.MathUtils.damp(
        cardBillboard.current.rotation.y,
        targetRotY,
        7.0,
        dt,
      )
      cardBillboard.current.rotation.x = THREE.MathUtils.damp(
        cardBillboard.current.rotation.x,
        targetRotX,
        7.0,
        dt,
      )
    }

    if (borderMat.current) {
      borderMat.current.opacity = THREE.MathUtils.damp(borderMat.current.opacity, targetOpacity, 8, dt)
    }

    if (haloMat.current) {
      const haloTarget = selected ? 0.65 : anySelected ? 0.02 : hovered ? 0.45 : 0.18
      haloMat.current.opacity = THREE.MathUtils.damp(haloMat.current.opacity, haloTarget, 8, dt)
    }

    if (ring.current) {
      ring.current.rotation.z += delta * (selected ? 1.5 : 0.45)
    }
  })

  return (
    <group ref={rootGroup} position={[card.position[0], lift, card.position[1]]}>
      {/* High-tech holographic floor pedestal under each card */}
      <group position={[0, -lift + 0.012, 0]} raycast={noRaycast}>
        {/* Outer glowing ring */}
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.85, 32]} />
          <meshBasicMaterial
            color={selected ? palette.cyan : palette.accent}
            transparent
            opacity={selected ? 0.9 : 0.55}
            toneMapped={false}
          />
        </mesh>

        {/* Inner glow disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.65, 32]} />
          <meshBasicMaterial
            color={selected ? palette.cyan : palette.accent}
            transparent
            opacity={selected ? 0.25 : 0.08}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Floating Card Billboard facing camera with 6DOF tilt */}
      <Billboard ref={cardBillboard}>
        <group>
          {/* Rotating Orbital Data Rings with dynamic mouse parallax */}
          <OrbitalDataRings active={selected} pointer={pointer} />

          {/* 4 Corner laser projection beams & floor shockwaves */}
          <CornerLaserBeams active={selected} />

          {/* Particle energy burst on dimension shift */}
          <DimensionBurstParticles active={selected} />

          {/* Accent bloom halo behind the panel */}
          <mesh position={[0, 0, -0.06]} raycast={noRaycast}>
            <planeGeometry args={[WIDTH * 1.18, HEIGHT * 1.18]} />
            <meshBasicMaterial
              ref={haloMat}
              color={selected ? '#00e5ff' : palette.accent}
              transparent
              opacity={0.22}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* Glowing border frame with electric blue / cyan edge */}
          <mesh position={[0, 0, -0.02]} raycast={noRaycast}>
            <planeGeometry args={[WIDTH + 0.06, HEIGHT + 0.06]} />
            <meshBasicMaterial
              ref={borderMat}
              color={selected ? '#00e5ff' : hovered ? palette.cyan : '#061d36'}
              transparent
              opacity={0.5}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* Main Card Surface with explicit raycasting and click handler */}
          <mesh
            onPointerOver={(e) => {
              e.stopPropagation()
              setHovered(true)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              setHovered(false)
              document.body.style.cursor = ''
            }}
            onClick={(e) => {
              e.stopPropagation()
              // Ignore click if a horizontal swipe just completed — prevents
              // accidental card expansion when the user is scrolling between cards.
              if (swipeLockRef.current) return
              onSelect(selected ? null : card.id)
            }}
          >
            <planeGeometry args={[WIDTH, HEIGHT]} />
            <meshBasicMaterial
              map={texture ?? fallback}
              transparent
              toneMapped={false}
            />
          </mesh>
        </group>
      </Billboard>
    </group>
  )
}