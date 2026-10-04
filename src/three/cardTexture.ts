import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { HubCard } from '../content'

const W = 1024
const H = 640
const PAD = 56

const mono = (px: number, weight = 400) =>
  `${weight} ${px}px "JetBrains Mono Variable", ui-monospace, monospace`
const sans = (px: number, weight = 400) =>
  `${weight} ${px}px "Inter Variable", system-ui, sans-serif`

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawGraphic(ctx: CanvasRenderingContext2D, type: HubCard['id'], x: number, y: number, w: number, h: number) {
  ctx.save()
  ctx.translate(x, y)

  if (type === 'audio') {
    // Audio Spectrum Visualizer
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i <= w; i += 5) {
      const wave = Math.sin(i * 0.12) * Math.cos(i * 0.05) * 22
      if (i === 0) ctx.moveTo(i, h / 2 + wave)
      else ctx.lineTo(i, h / 2 + wave)
    }
    ctx.stroke()

    // Frequency equalizer bars
    const barCount = 14
    const barW = 7
    const gap = 6
    for (let b = 0; b < barCount; b++) {
      const bh = 8 + Math.abs(Math.sin(b * 0.75 + 1.2)) * 36
      ctx.fillStyle = b % 2 === 0 ? '#00e5ff' : '#0088ff'
      ctx.fillRect(b * (barW + gap) + 40, h / 2 - bh / 2, barW, bh)
    }
  } else if (type === 'lab') {
    // WGSL Matrix Compute Grid
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)'
    ctx.lineWidth = 1
    const gridSize = 20
    for (let gx = 0; gx <= w; gx += gridSize) {
      ctx.beginPath()
      ctx.moveTo(gx, 0)
      ctx.lineTo(gx, h)
      ctx.stroke()
    }
    for (let gy = 0; gy <= h; gy += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, gy)
      ctx.lineTo(w, gy)
      ctx.stroke()
    }

    // Mathematical node vector
    ctx.strokeStyle = '#00e5ff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(10, h - 10)
    ctx.lineTo(w * 0.4, 15)
    ctx.lineTo(w * 0.7, h - 25)
    ctx.lineTo(w - 10, 10)
    ctx.stroke()

    // Active compute node dots
    ctx.fillStyle = '#ffffff'
    const dots = [
      [10, h - 10],
      [w * 0.4, 15],
      [w * 0.7, h - 25],
      [w - 10, 10],
    ]
    for (const [dx, dy] of dots) {
      ctx.beginPath()
      ctx.arc(dx, dy, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (type === 'contact') {
    // Radar Scanning Reticle & Ping
    const cx = w / 2
    const cy = h / 2
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)'
    ctx.lineWidth = 1.5

    // Concentric rings
    for (const r of [18, 36, 54]) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Crosshairs
    ctx.beginPath()
    ctx.moveTo(cx - 58, cy)
    ctx.lineTo(cx + 58, cy)
    ctx.moveTo(cx, cy - 58)
    ctx.lineTo(cx, cy + 58)
    ctx.stroke()

    // Ping blip
    ctx.fillStyle = '#00e5ff'
    ctx.beginPath()
    ctx.arc(cx + 22, cy - 18, 4.5, 0, Math.PI * 2)
    ctx.fill()
  } else if (type === 'about') {
    // Biometric DNA / Identity Waveform
    ctx.strokeStyle = 'rgba(0, 136, 255, 0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i <= w; i += 6) {
      const y1 = h / 2 + Math.sin(i * 0.07) * 26
      if (i === 0) ctx.moveTo(i, y1)
      else ctx.lineTo(i, y1)
    }
    ctx.stroke()

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)'
    ctx.beginPath()
    for (let i = 0; i <= w; i += 6) {
      const y2 = h / 2 + Math.sin(i * 0.07 + Math.PI) * 26
      if (i === 0) ctx.moveTo(i, y2)
      else ctx.lineTo(i, y2)
    }
    ctx.stroke()

    // Connection rungs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = 1
    for (let i = 15; i <= w - 15; i += 22) {
      const y1 = h / 2 + Math.sin(i * 0.07) * 26
      const y2 = h / 2 + Math.sin(i * 0.07 + Math.PI) * 26
      ctx.beginPath()
      ctx.moveTo(i, y1)
      ctx.lineTo(i, y2)
      ctx.stroke()
    }
  } else {
    // 'works': 3D Isometric Viewport Schematic
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.55)'
    ctx.lineWidth = 2
    // Isometric project viewport rectangle
    ctx.strokeRect(15, 10, w - 30, h - 20)

    // Viewport diagonal grid
    ctx.strokeStyle = 'rgba(0, 136, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(15, 10)
    ctx.lineTo(w - 15, h - 10)
    ctx.moveTo(w - 15, 10)
    ctx.lineTo(15, h - 10)
    ctx.stroke()

    // Target crosshair
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.5
    ctx.strokeRect(w / 2 - 12, h / 2 - 12, 24, 24)
  }

  ctx.restore()
}

function drawCard(ctx: CanvasRenderingContext2D, c: HubCard) {
  const accent = '#0088ff'
  const cyan = '#00e5ff'

  ctx.clearRect(0, 0, W, H)

  // Panel body: deep obsidian blue glass
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, 'rgba(6, 12, 24, 0.98)')
  bg.addColorStop(1, 'rgba(2, 5, 12, 0.99)')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Left cyan glow sweep
  const sideGlow = ctx.createLinearGradient(0, 0, 190, 0)
  sideGlow.addColorStop(0, 'rgba(0, 136, 255, 0.25)')
  sideGlow.addColorStop(0.5, 'rgba(0, 229, 255, 0.08)')
  sideGlow.addColorStop(1, 'rgba(0, 229, 255, 0)')
  ctx.fillStyle = sideGlow
  ctx.fillRect(0, 0, 190, H)

  // Tech grid lines
  ctx.strokeStyle = 'rgba(0, 136, 255, 0.07)'
  ctx.lineWidth = 1
  for (let x = 0; x <= W; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y <= H; y += 64) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  // Left glowing accent rail with bright neon pip
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, 8, H)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 8, 40)

  // Corner brackets with cyan glow
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.85)'
  ctx.lineWidth = 2.5
  const b = 32
  const corners: [number, number, number, number][] = [
    [PAD, PAD, 1, 1],
    [W - PAD, PAD, -1, 1],
    [PAD, H - PAD, 1, -1],
    [W - PAD, H - PAD, -1, -1],
  ]
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath()
    ctx.moveTo(cx, cy + dy * b)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx + dx * b, cy)
    ctx.stroke()
  }

  // Header row: status indicator dot + HUB code + Kanji badge
  ctx.fillStyle = cyan
  ctx.beginPath()
  ctx.arc(PAD + 22, PAD + 32, 5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = cyan
  ctx.font = mono(22, 700)
  ctx.textBaseline = 'middle'
  ctx.fillText(`SYS.ONLINE // ${c.code}`, PAD + 38, PAD + 32)

  // Japanese Kanji Category Tag in header
  ctx.fillStyle = '#ffffff'
  ctx.font = sans(20, 700)
  ctx.fillText(`[ ${c.kanji} // ${c.subtitle} ]`, PAD + 270, PAD + 32)

  // Metric tag on top right
  const metricText = `[ ${c.metricValue} ]`
  ctx.font = mono(20, 600)
  ctx.textAlign = 'right'
  ctx.fillStyle = cyan
  ctx.fillText(metricText, W - PAD - 18, PAD + 32)
  ctx.textAlign = 'left'

  // Decorative header divider line
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD + 18, PAD + 56)
  ctx.lineTo(W - PAD - 18, PAD + 56)
  ctx.stroke()

  // Card Main Title (Pure White / Chrome)
  ctx.fillStyle = '#ffffff'
  ctx.font = sans(64, 900)
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(c.title, PAD + 18, PAD + 138)

  // Thematic Graphic Area on right
  drawGraphic(ctx, c.id, W - PAD - 260, PAD + 80, 240, 90)

  // Tagline / Description
  ctx.fillStyle = 'rgba(235, 242, 255, 0.82)'
  ctx.font = sans(26, 400)
  const lines = wrap(ctx, c.tagline, W - PAD * 2 - 36)
  lines.slice(0, 3).forEach((line, i) => {
    ctx.fillText(line, PAD + 18, PAD + 214 + i * 42)
  })

  // Lower Divider
  ctx.strokeStyle = 'rgba(240, 245, 255, 0.16)'
  ctx.lineWidth = 1.5
  const divY = H - PAD - 88
  ctx.beginPath()
  ctx.moveTo(PAD + 18, divY)
  ctx.lineTo(W - PAD - 18, divY)
  ctx.stroke()

  // Metric label on bottom left
  ctx.fillStyle = cyan
  ctx.font = mono(22, 700)
  ctx.fillText(`TELEMETRY // ${c.metricLabel}`, PAD + 18, divY + 44)

  // Stack pills on bottom right
  ctx.font = mono(19, 600)
  let tagX = W - PAD - 18
  for (const tag of [...c.tags].reverse()) {
    const label = tag.toUpperCase()
    const tw = ctx.measureText(label).width
    const pillW = tw + 22
    const pillH = 34
    if (tagX - pillW < PAD + 330) break

    // Pill background
    ctx.fillStyle = 'rgba(0, 136, 255, 0.16)'
    ctx.fillRect(tagX - pillW, divY + 22, pillW, pillH)

    // Pill border
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.65)'
    ctx.lineWidth = 1
    ctx.strokeRect(tagX - pillW, divY + 22, pillW, pillH)

    // Pill text
    ctx.fillStyle = '#ffffff'
    ctx.fillText(label, tagX - pillW + 11, divY + 46)
    tagX -= pillW + 12
  }
}

/** Renders a hub card to a texture, re-creating it when the card data changes. */
export function useCardTexture(card: HubCard) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    let cancelled = false
    let created: THREE.CanvasTexture | null = null

    const build = () => {
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      if (!ctx || cancelled) return

      drawCard(ctx, card)

      created = new THREE.CanvasTexture(canvas)
      created.colorSpace = THREE.SRGBColorSpace
      created.anisotropy = 8
      created.needsUpdate = true
      setTexture(created)
    }

    document.fonts.ready.then(() => requestAnimationFrame(build))

    return () => {
      cancelled = true
      created?.dispose()
    }
  }, [card])

  return texture
}

/** Shared rounded-rect fallback used while the texture is still building. */
export function useFallbackTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgba(10, 18, 32, 0.9)'
    ctx.fillRect(0, 0, 64, 64)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}