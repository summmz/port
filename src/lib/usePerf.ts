import { useEffect, useRef, useState } from 'react'
import { qualityPresets, type Quality, type QualityName } from '../three/quality'

export type { QualityName } from '../three/quality'

export interface GpuReport {
  webgpu: 'available' | 'unavailable' | 'unknown'
  renderer: string
  mobile: boolean
  reducedMotion: boolean
  cores: number
}

export function detectGpu(): GpuReport {
  const canvas = document.createElement('canvas')
  const gl =
    (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ??
    (canvas.getContext('webgl') as WebGLRenderingContext | null)

  let renderer = 'unknown'
  if (gl) {
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (ext) renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
    // Release the probe context immediately so it does not count against the
    // browser's concurrent context limit.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }

  return {
    webgpu: 'unknown',
    renderer,
    mobile: matchMedia('(pointer: coarse)').matches || innerWidth < 820,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    cores: navigator.hardwareConcurrency ?? 4,
  }
}

export async function detectWebGPU(): Promise<'available' | 'unavailable'> {
  const gpu = (navigator as Navigator & { gpu?: GPU }).gpu
  if (!gpu) return 'unavailable'
  try {
    // Adapter request resolves null more often than it rejects.
    const adapter = await gpu.requestAdapter()
    return adapter ? 'available' : 'unavailable'
  } catch {
    return 'unavailable'
  }
}

/** Picks a starting quality tier from device signals. */
export function initialQuality(report: GpuReport): QualityName {
  const forced = new URLSearchParams(location.search).get('q')
  if (forced === 'high' || forced === 'balanced' || forced === 'raw') return forced
  if (report.mobile || report.reducedMotion || report.cores <= 4) return 'balanced'
  return 'high'
}

export interface PerfState {
  fps: number
  quality: QualityName
  autoTuned: boolean
  setQuality: (q: QualityName) => void
  qualityConfig: Quality
}

/**
 * Rolling FPS meter that can step quality down when the frame budget is blown
 * for a sustained period. Manual selection pins the tier and disables auto-tune.
 */
export function usePerf(initial: QualityName): PerfState {
  const [quality, setQualityState] = useState<QualityName>(initial)
  const [fps, setFps] = useState(60)
  const [pinned, setPinned] = useState(false)
  const poorFrames = useRef(0)

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let acc = 0
    let frames = 0

    const tick = (now: number) => {
      const dt = now - last
      last = now
      acc += dt
      frames++

      if (acc >= 500) {
        const measured = (frames * 1000) / acc
        setFps(Math.round(measured))
        acc = 0
        frames = 0

        // Require sustained failure before downgrading, so a single hitch or a
        // backgrounded tab does not permanently degrade quality.
        if (!pinned && measured < 42) {
          poorFrames.current++
          if (poorFrames.current >= 6) {
            setQualityState((q) => (q === 'high' ? 'balanced' : q === 'balanced' ? 'raw' : q))
            poorFrames.current = 0
          }
        } else {
          poorFrames.current = 0
        }
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pinned])

  return {
    fps,
    quality,
    autoTuned: !pinned,
    qualityConfig: qualityPresets[quality],
    setQuality: (q) => {
      setPinned(true)
      setQualityState(q)
    },
  }
}