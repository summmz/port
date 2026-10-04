import { Component, Suspense, useCallback, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { hubCards, type CardType, type SectionId } from './content'
import { detectGpu, detectWebGPU, initialQuality, usePerf, type GpuReport } from './lib/usePerf'
import { RIGS } from './three/rigs'
import { Stage } from './three/Stage'
import { qualityOrder } from './three/quality'
import { Hud } from './ui/Hud'
import { swipeLockRef } from './lib/swipeLock'

export default function App() {
  const [section, setSection] = useState<SectionId>('home')
  const [selected, setSelected] = useState<CardType | null>(null)
  const [booting, setBooting] = useState(true)
  const [gpu] = useState<GpuReport>(detectGpu)
  const [webgpu, setWebgpu] = useState<'available' | 'unavailable' | 'unknown'>('unknown')

  const perf = usePerf(initialQuality(gpu))

  useEffect(() => {
    detectWebGPU().then(setWebgpu)
    // Safety fallback so boot screen never hangs
    const timer = setTimeout(() => setBooting(false), 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelected(null)
        setSection('home')
        return
      }
      const index = Number(e.key) - 1
      if (Number.isInteger(index) && index >= 0 && index < hubCards.length) {
        const cardId = hubCards[index].id
        setSelected(cardId)
        setSection(cardId)
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  const cycleQuality = useCallback(() => {
    const i = qualityOrder.indexOf(perf.quality)
    perf.setQuality(qualityOrder[(i + 1) % qualityOrder.length])
  }, [perf])

  const handleSelectCard = useCallback((cardId: CardType | null) => {
    setSelected(cardId)
    setSection(cardId ? cardId : 'home')
  }, [])

  const handleNavigate = useCallback((id: SectionId) => {
    setSection(id)
    if (id !== 'home') setSelected(id as CardType)
    else setSelected(null)
  }, [])

  return (
    <ErrorBoundary>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ fov: 56, near: 0.1, far: 140, position: RIGS.home.pos }}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
        style={{ touchAction: 'none' }}
        onPointerMissed={() => {
          // Don't deselect while a horizontal swipe is in progress
          if (swipeLockRef.current) return
          handleSelectCard(null)
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#040407', 1)
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.15
          setBooting(false)
        }}
      >
        <Suspense fallback={null}>
          <Stage
            section={section}
            selected={selected}
            onSelect={handleSelectCard}
            onNavigate={handleNavigate}
            quality={perf.qualityConfig}
          />
        </Suspense>
      </Canvas>

      <Hud
        section={section}
        onNavigate={handleNavigate}
        gpu={gpu}
        webgpu={webgpu}
        perf={perf}
        selected={selected}
        onSelect={handleSelectCard}
        onToggleQuality={cycleQuality}
      />

      {booting && <Boot />}
    </ErrorBoundary>
  )
}

function Boot() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-void">
      <div className="flex flex-col items-center gap-4">
        <div className="hud-label text-accent">initialising render engine</div>
        <div className="h-px w-48 overflow-hidden bg-bone/10">
          <div className="h-full w-1/3 bg-accent [animation:scan-sweep_1.4s_linear_infinite]" />
        </div>
      </div>
    </div>
  )
}

interface BoundaryState {
  failed: boolean
}

/** Catches GPU context loss and shader compile failures, which otherwise render a blank page. */
class ErrorBoundary extends Component<{ children: React.ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false }

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="grid min-h-full place-items-center bg-void p-8 text-center">
          <div>
            <h1 className="font-mono text-sm tracking-[0.3em] text-accent uppercase">
              render context lost
            </h1>
            <p className="mt-3 max-w-sm text-sm text-bone/60">
              This experience needs WebGL2. If your browser has hardware acceleration disabled,
              enable it and reload.
            </p>
            <button
              onClick={() => location.reload()}
              className="mt-6 border border-accent/50 px-4 py-2 font-mono text-[0.65rem] tracking-[0.2em] text-accent uppercase hover:bg-accent hover:text-void"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}