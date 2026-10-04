import * as THREE from 'three'

export type RendererKind = 'webgpu' | 'webgl'

/** Forces a backend via `?renderer=webgl|webgpu`. Empty means auto-detect. */
export function rendererOverride(): RendererKind | null {
  const v = new URLSearchParams(location.search).get('renderer')
  return v === 'webgpu' || v === 'webgl' ? v : null
}

let cached: Promise<RendererKind> | null = null

/** Memoised so concurrent callers share one adapter request. */
export function preferredRenderer(): Promise<RendererKind> {
  const forced = rendererOverride()
  if (forced) return Promise.resolve(forced)
  cached ??= (async () => {
    const gpu = (navigator as Navigator & { gpu?: GPU }).gpu
    if (!gpu) return 'webgl' as const
    try {
      // Resolves null more often than it rejects, even on some supported setups.
      const adapter = await gpu.requestAdapter()
      return adapter ? ('webgpu' as const) : ('webgl' as const)
    } catch {
      return 'webgl' as const
    }
  })()
  return cached
}

type RendererProps = ConstructorParameters<typeof THREE.WebGLRenderer>[0]

/**
 * Builds the renderer react-three-fiber should use.
 *
 * WebGPURenderer is initialised asynchronously and carries a WebGL2 backend
 * fallback internally, so a single code path covers both.
 */
export async function createRenderer(props?: RendererProps) {
  const kind = await preferredRenderer()

  if (kind === 'webgpu') {
    try {
      const { WebGPURenderer } = await import('three/webgpu')
      const renderer = new WebGPURenderer({
        ...props,
        antialias: props?.antialias ?? false,
        alpha: false,
      } as ConstructorParameters<typeof WebGPURenderer>[0])
      await renderer.init()
      renderer.setClearColor('#040407', 1)
      return renderer
    } catch (err) {
      console.warn('[renderer] WebGPU init failed, falling back to WebGL2:', err)
      cached = Promise.resolve('webgl' as const)
    }
  }

  const renderer = new THREE.WebGLRenderer({ ...props, antialias: false, alpha: false })
  renderer.setClearColor('#040407', 1)
  return renderer
}