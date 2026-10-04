/**
 * Single source of truth for the art direction.
 * Changing values here re-skins both the DOM (via CSS custom properties) and
 * the 3D scene (emissive/material colors).
 */
export const palette = {
  void: '#040407',
  abyss: '#07080d',
  graphite: '#101217',
  smoke: '#20242e',
  bone: '#eff2f7',

  accent: '#0088ff', // Electric Blue
  accentDim: '#0055cc', // Deep Electric Blue
  cyan: '#00e5ff', // Bright Cyan
  coral: '#4dd8ff', // Sky Cyan
  chrome: '#e2e6ee',
  white: '#ffffff',

  hud: 'rgba(239, 242, 247, 0.42)',
  hudBright: 'rgba(239, 242, 247, 0.92)',
} as const

export type Palette = typeof palette

/** Mirrors `palette` into CSS custom properties so Tailwind utilities can use them. */
export function applyTheme(p: Palette = palette) {
  const root = document.documentElement
  for (const [key, value] of Object.entries(p)) {
    root.style.setProperty(`--c-${key}`, value)
  }
}

export const type = {
  mono: '"JetBrains Mono Variable", ui-monospace, monospace',
  sans: '"Inter Variable", system-ui, sans-serif',
} as const