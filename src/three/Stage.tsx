import { useMemo, useRef, useEffect } from 'react'
import { Points, PointMaterial } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { CardType, SectionId } from '../content'
import { hubCards, sections } from '../content'
import { palette } from '../theme'
import { CameraRig } from './CameraRig'
import type { Quality } from './quality'
import { CyberEnvironment } from './CyberEnvironment'
import { Effects } from './Effects'
import { FloorNode } from './FloorNode'
import { MirrorFloor } from './MirrorFloor'
import { ProjectCard } from './ProjectCard'

/** Deterministic PRNG so the mote field is identical across reloads and StrictMode remounts. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Slow-drifting motes to give the void parallax and depth. */
function Dust({ count = 2800, seed = 1337 }: { count?: number; seed?: number }) {
  const positions = useMemo(() => {
    const rand = mulberry32(seed)
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 44
      arr[i * 3 + 1] = rand() * 18 - 2       // spans y: -2 → 16
      arr[i * 3 + 2] = (rand() - 0.5) * 44
    }
    return arr
  }, [count, seed])

  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.rotation.y = t * 0.012
    g.position.y = Math.sin(t * 0.18) * 0.3
  })

  return (
    <group ref={group}>
      <Points positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          color={palette.smoke}
          size={0.038}
          sizeAttenuation
          transparent
          opacity={0.75}
          depthWrite={false}
          toneMapped={false}
        />
      </Points>
    </group>
  )
}

interface StageProps {
  section: SectionId
  selected: CardType | null
  onSelect: (id: CardType | null) => void
  onNavigate: (id: SectionId) => void
  quality: Quality
}

/**
 * A minimal gradient environment so metallic surfaces have something to reflect.
 * Without this, metalness > 0 renders near-black — the classic three.js trap.
 * Assigned as a plain equirect texture rather than PMREM-filtered so the same
 * code works on the WebGPU backend.
 */
function GradientEnvironment() {
  const { gl, scene } = useThree()

  useEffect(() => {
    const w = 64
    const data = new Uint8Array(w * w * 4)
    for (let y = 0; y < w; y++) {
      const t = y / (w - 1)
      // Cool zenith → dark horizon, with a warm band low for floor bounce.
      const r = 18 + t * 70
      const g = 26 + t * 96
      const b = 44 + t * 150
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        data[i] = r
        data[i + 1] = g
        data[i + 2] = b
        data[i + 3] = 255
      }
    }

    const tex = new THREE.DataTexture(data, w, w, THREE.RGBAFormat)
    tex.mapping = THREE.EquirectangularReflectionMapping
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true

    scene.environment = tex
    scene.environmentIntensity = 0.55

    return () => {
      scene.environment = null
      tex.dispose()
    }
  }, [gl, scene])

  return null
}

export function Stage({ section, selected, onSelect, onNavigate, quality }: StageProps) {
  return (
    <>
      {/* Fog pulled back to frame distant cyber architecture */}
      <fog attach="fog" args={[palette.void, 24, 75]} />

      <CameraRig section={section} selected={selected} />
      <GradientEnvironment />

      <ambientLight intensity={1.1} color="#d6eaff" />
      <hemisphereLight intensity={0.7} color="#00e5ff" groundColor="#080c16" />
      <directionalLight position={[6, 14, 10]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-9, 4.5, 5]} intensity={140} distance={36} decay={2} color={palette.accent} />
      <pointLight position={[10, 5, -4]} intensity={110} distance={34} decay={2} color={palette.cyan} />
      <pointLight position={[0, 7, 14]} intensity={80} distance={38} decay={2} color="#1a8cff" />
      <pointLight position={[0, 3, 0]} intensity={50} distance={20} decay={2} color={palette.accent} />

      <MirrorFloor resolution={quality.reflectorResolution} />
      <Dust />
      <CyberEnvironment />

      {/* Floating 3D Thematic Hub Cards (Works, About, Lab, Audio, Contact) */}
      {hubCards.map((card, i) => (
        <ProjectCard
          key={card.id}
          card={card}
          index={i}
          selected={selected === card.id}
          anySelected={Boolean(selected)}
          onSelect={onSelect}
        />
      ))}

      {sections
        .filter((s) => s.id in nodePositions && !(section === 'home' && s.id === 'home'))
        .map((s) => (
          <FloorNode
            key={s.id}
            id={s.id}
            label={s.label}
            kanji={s.kanji}
            position={nodePositions[s.id]}
            onNavigate={onNavigate}
            anySelected={Boolean(selected)}
          />
        ))}

      <Effects quality={quality} isCardSelected={Boolean(selected)} />
    </>
  )
}

const nodePositions: Record<string, [number, number]> = {
  home: [0, 8.5],
  works: [-8.4, 4.5],
  about: [-4.2, 5.5],
  lab: [0.0, 6.0],
  audio: [4.2, 5.5],
  contact: [8.4, 4.5],
}