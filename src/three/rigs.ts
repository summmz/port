import type { SectionId } from '../content'

export interface Rig {
  pos: [number, number, number]
  look: [number, number, number]
  /** Pointer parallax gain. */
  drift: number
}

/** Camera stations per section. GSAP tweens between these; the rig never hard-cuts. */
export const RIGS: Record<SectionId, Rig> = {
  home:    { pos: [0, 2.8, 12.8], look: [0, 2.35, 0.0], drift: 0.9 },
  works:   { pos: [-8.4, 2.5, 4.8], look: [-8.4, 2.35, 0.2], drift: 0.35 },
  about:   { pos: [-4.2, 2.5, 6.2], look: [-4.2, 2.35, 1.8], drift: 0.35 },
  lab:     { pos: [0.0, 2.5, 6.8], look: [0.0, 2.35, 2.4], drift: 0.35 },
  audio:   { pos: [4.2, 2.5, 6.2], look: [4.2, 2.35, 1.8], drift: 0.35 },
  contact: { pos: [8.4, 2.5, 4.8], look: [8.4, 2.35, 0.2], drift: 0.35 },
}