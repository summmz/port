import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import type { SectionId } from '../content'
import { RIGS } from './rigs'

const DEFAULTS = RIGS.home

export function CameraRig({
  section,
  selected,
}: {
  section: SectionId
  selected: string | null
}) {
  const { camera, pointer } = useThree()
  const [zoomOffset, setZoomOffset] = useState(0)

  // Live rig values. GSAP tweens these; useFrame only reads them.
  const rig = useRef({
    px: DEFAULTS.pos[0],
    py: DEFAULTS.pos[1],
    pz: DEFAULTS.pos[2],
    lx: DEFAULTS.look[0],
    ly: DEFAULTS.look[1],
    lz: DEFAULTS.look[2],
    drift: DEFAULTS.drift,
  })

  const lookTarget = useRef(new THREE.Vector3())
  const smoothLook = useRef(new THREE.Vector3(...DEFAULTS.look))

  // Mouse wheel scroll to smoothly zoom in/out — disabled while a card is selected
  // so the Blade sheet scroll doesn't also move the camera behind it.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (selected) return   // card is open → let the blade sheet handle scrolling
      setZoomOffset((z) => Math.max(-3.5, Math.min(4.0, z + e.deltaY * 0.003)))
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [selected])

  useEffect(() => {
    const targetSection = (selected as SectionId) || section
    const target = RIGS[targetSection] ?? RIGS.home
    const isDesktop = window.innerWidth >= 1024
    const isMobile = window.innerWidth < 640

    let px = target.pos[0]
    let py = target.pos[1]
    let pz = target.pos[2]
    let lx = target.look[0]
    let ly = target.look[1]
    let lz = target.look[2]

    if (selected) {
      if (isDesktop) {
        // Desktop: shift camera slightly right so card is centered in the left 60% viewport
        px += 1.15
        lx += 1.15
      } else if (isMobile) {
        // Mobile portrait: back up so the card fits within the viewport width
        pz += 2.2
        py += 0.4
        ly += 0.15
      }
    }

    const tween = gsap.to(rig.current, {
      px,
      py,
      pz,
      lx,
      ly,
      lz,
      drift: isMobile ? 0.08 : target.drift,
      duration: 1.4,
      ease: 'power3.inOut',
      overwrite: 'auto',
    })

    return () => {
      tween.kill()
    }
  }, [section, selected])

  useFrame((state) => {
    const r = rig.current
    const t = state.clock.elapsedTime

    // Idle float keeps the frame alive when the cursor is still.
    const idleY = Math.sin(t * 0.35) * 0.08
    const idleX = Math.sin(t * 0.23) * 0.1

    // Adaptive aspect-ratio depth compensation for mobile portrait screens
    const aspect = state.viewport.aspect
    const portraitOffset = aspect < 1 ? (1 / Math.max(0.35, aspect) - 1) * 3.5 : 0

    camera.position.set(
      r.px + pointer.x * r.drift + idleX,
      r.py + pointer.y * r.drift * 0.35 + idleY,
      r.pz + zoomOffset + (selected ? 0 : portraitOffset),
    )

    lookTarget.current.set(r.lx, r.ly, r.lz)
    // Damp the look target so orientation never snaps.
    smoothLook.current.lerp(lookTarget.current, 0.07)
    camera.lookAt(smoothLook.current)
  })

  return null
}