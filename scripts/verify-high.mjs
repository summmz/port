import { chromium } from 'playwright'

const arg = process.argv[2] ?? 'http://localhost:4173'
const OUT = process.argv[3] ?? '../opencode/shot-high.png'
const tier = process.env.TIER ?? 'high'

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})

const page = await browser.newPage({ viewport: { width: 800, height: 500 } })

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`[error] ${m.text()}`)
})
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))

// Start on the cheapest tier, then click RENDER until the pinned tier matches.
// Clicking pins quality, which suspends the auto-tuner, so the heavy pipeline
// gets a chance to compile even at single-digit FPS.
await page.goto(`${arg}?q=raw`, { waitUntil: 'load' })
await page.waitForTimeout(4000)

for (let i = 0; i < 3; i++) {
  const label = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('RENDER:'),
    )
    return btn?.textContent?.trim() ?? null
  })
  if (label?.includes(tier.toUpperCase())) break
  await page.click('text=/RENDER:/')
  await page.waitForTimeout(2500)
}

const active = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    b.textContent?.includes('RENDER:'),
  )
  return btn?.textContent?.trim() ?? null
})

// Software rendering needs a long window to finish a DOF+bloom frame.
await page.waitForTimeout(25000)

const buf = await page.screenshot({ path: OUT, animations: 'disabled', timeout: 180_000 })

const stats = await page.evaluate(async (b64) => {
  const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob()
  const bmp = await createImageBitmap(blob)
  const c = new OffscreenCanvas(bmp.width, bmp.height)
  const ctx = c.getContext('2d')
  ctx.drawImage(bmp, 0, 0)
  const { data } = ctx.getImageData(0, 0, bmp.width, bmp.height)
  let sum = 0
  let sumSq = 0
  let n = 0
  const buckets = new Set()
  for (let i = 0; i < data.length; i += 4) {
    const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255
    sum += lum
    sumSq += lum * lum
    n++
    buckets.add((data[i] >> 4) << 8 | (data[i + 1] >> 4) << 4 | (data[i + 2] >> 4))
  }
  const mean = sum / n
  return {
    meanLuminance: +mean.toFixed(4),
    stdDev: +Math.sqrt(sumSq / n - mean * mean).toFixed(4),
    distinctColorBuckets: buckets.size,
  }
}, buf.toString('base64'))

console.log(JSON.stringify({ requestedTier: tier, active, stats, errors }, null, 2))

await browser.close()