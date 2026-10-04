export interface Quality {
  bloom: boolean
  depthOfField: boolean
  chromatic: boolean
  grain: boolean
  scanline: boolean
  reflectorResolution: number
  multisampling: number
}

export type QualityName = 'high' | 'balanced' | 'raw'

export const qualityPresets: Record<QualityName, Quality> = {
  high: {
    bloom: true,
    depthOfField: false,
    chromatic: true,
    grain: true,
    scanline: true,
    reflectorResolution: 512,
    multisampling: 2,
  },
  balanced: {
    bloom: true,
    depthOfField: false,
    chromatic: true,
    grain: false,
    scanline: false,
    reflectorResolution: 384,
    multisampling: 0,
  },
  raw: {
    bloom: true,
    depthOfField: false,
    chromatic: false,
    grain: false,
    scanline: false,
    reflectorResolution: 256,
    multisampling: 0,
  },
}

export const qualityOrder: QualityName[] = ['high', 'balanced', 'raw']