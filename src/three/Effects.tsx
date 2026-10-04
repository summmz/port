import { useMemo } from 'react'
import * as THREE from 'three'
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  Noise,
  Scanline,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'
import type { Quality } from './quality'

interface EffectsProps {
  quality: Quality
  isCardSelected?: boolean
}

export function Effects({ quality, isCardSelected = false }: EffectsProps) {
  const aberrationOffset = useMemo(() => new THREE.Vector2(0.0006, 0.0009), [])

  return (
    <EffectComposer multisampling={quality.multisampling} enableNormalPass={false}>
      {quality.bloom && (
        <Bloom
          intensity={isCardSelected ? 1.25 : 1.1}
          luminanceThreshold={0.38}
          luminanceSmoothing={0.28}
          kernelSize={KernelSize.LARGE}
          mipmapBlur
        />
      )}

      {/* Dynamic Depth of Field: Shifting to deep cinematic bokeh when inspecting a portal card */}
      {quality.depthOfField && (
        <DepthOfField
          focusDistance={isCardSelected ? 0.042 : 0.13}
          focalLength={isCardSelected ? 0.055 : 0.08}
          bokehScale={isCardSelected ? 5.2 : 2.0}
          height={480}
          resolutionScale={0.5}
        />
      )}

      {quality.chromatic && (
        <ChromaticAberration
          offset={aberrationOffset}
          radialModulation
          modulationOffset={0.42}
          blendFunction={BlendFunction.NORMAL}
        />
      )}

      {quality.grain && (
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.22} />
      )}

      {quality.scanline && (
        <Scanline density={1.2} opacity={0.035} blendFunction={BlendFunction.OVERLAY} />
      )}

      <Vignette eskil={false} offset={0.28} darkness={0.72} />
    </EffectComposer>
  )
}