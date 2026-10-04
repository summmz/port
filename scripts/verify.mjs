import { chromium } from 'playwright'

const arg = process.argv[2] ?? 'http://localhost:4173'
const OUT = process.argv[3] ?? '../opencode/shot-index.png'

// Software GL cannot sustain the full post pipeline, so force the cheapest
// tier and a small viewport for the headless run.
const tier = process.env.Q ?? 'raw'
const target = new URL(arg)
target.searchParams.set('q', tier)

const browser = await chromium.launch({
  args: [
    // Force a software GL path so WebGL works in headless. Without these the
    // context creation fails and the page silently renders nothing.
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})

const page = await browser.newPage({
  viewport: { width: 960, height: 600 },
  deviceScaleFactor: 1,
})

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`[error] ${m.text()}`)
})
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))

await page.goto(target.href, { waitUntil: 'load' })
// Let shaders compile, fonts resolve, and the camera tween settle.
await page.waitForTimeout(8000)

/**
 * Decodes a PNG buffer inside the page and reports luminance statistics, so we
 * can prove the frame has real structure instead of being a flat black or
 * mid-grey canvas. A flat frame is the classic symptom of a silently failed
 * shader compile.
 */
async function analyze(buffer) {
  return page.evaluate(async (b64) => {
    const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob()
    const bmp = await createImageBitmap(blob)
    const c = new OffscreenCanvas(bmp.width, bmp.height)
    const ctx = c.getContext('2d')
    ctx.drawImage(bmp, 0, 0)
    const { data } = ctx.getImageData(0, 0, bmp.width, bmp.height)

    let sum = 0
    let sumSq = 0
    let n = 0
    let accent = 0
    let cyan = 0
    let lit = 0
    const buckets = new Set()

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const bl = data[i + 2]
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * bl) / 255
      sum += lum
      sumSq += lum * lum
      n++
      if (lum > 0.06) lit++
      // Accent #c8ff3d — green dominant, high value.
      if (g > 150 && r > 90 && r < 220 && bl < 120) accent++
      // Cyan #4dd8ff — blue dominant and bright.
      if (bl > 140 && g > 120 && r < 130) cyan++
      buckets.add((r >> 4) << 8 | (g >> 4) << 4 | (bl >> 4))
    }

    const mean = sum / n
    return {
      size: `${bmp.width}x${bmp.height}`,
      meanLuminance: +mean.toFixed(4),
      stdDev: +Math.sqrt(sumSq / n - mean * mean).toFixed(4),
      distinctColorBuckets: buckets.size,
      litPixelPct: +((lit / n) * 100).toFixed(2),
      accentPixelPct: +((accent / n) * 100).toFixed(3),
      cyanPixelPct: +((cyan / n) * 100).toFixed(3),
    }
  }, buffer.toString('base64'))
}

const sections = ['index', 'work', 'lab']
const results = {}

for (const [i, name] of sections.entries()) {
  if (i > 0) {
    await page.keyboard.press(String(i + 1))
    await page.waitForTimeout(3500)
  }
  const path = OUT.replace('.png', `-${name}.png`)
  const buf = await page.screenshot({ path, animations: 'disabled', timeout: 120_000 })
  results[name] = await analyze(buf)
}

const hud = await page.evaluate(() => document.body.innerText.slice(0, 200))

console.log(JSON.stringify({ tier, results, hud, errors }, null, 2))

await browser.close()