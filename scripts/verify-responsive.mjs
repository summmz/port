import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const arg = process.argv[2] ?? 'http://localhost:4173'
const OUT = process.argv[3] ?? 'C:/Users/isumi/AppData/Local/Temp/opencode/responsive'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})

async function newPage(w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[console] ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
  return { page, errors }
}

const bladeOpen = (page) => page.locator('section[aria-label="Node Inspector"]').count().then((n) => n > 0)

const capsuleName = async (page) =>
  page
    .locator('button[aria-label="Next Section"]')
    .evaluate((el) => {
      const info = el.previousElementSibling
      return (info && (info.textContent || '').trim()) || ''
    })
    .catch(() => '')

const bladeBox = (page) =>
  page
    .locator('section[aria-label="Node Inspector"]')
    .boundingBox()
    .catch(() => null)

const report = { viewports: [], interactions: {}, errors: [] }

// ---------------------------------------------------------------------------
// 1. Layout pass across every critical breakpoint.
// ---------------------------------------------------------------------------
for (const [w, h] of [[360, 800], [390, 844], [844, 390], [768, 1024], [1024, 768], [1280, 800]]) {
  const { page, errors } = await newPage(w, h)
  await page.goto(`${arg}?q=raw`, { waitUntil: 'load' })
  await page.waitForTimeout(6500)

  const overflow = await page.evaluate(() => ({
    h: document.documentElement.scrollWidth > window.innerWidth + 1,
    v: document.documentElement.scrollHeight > window.innerHeight + 1,
  }))

  const shot = `${OUT}/${w}x${h}.png`
  await page.screenshot({ path: shot, fullPage: true, animations: 'disabled', timeout: 120_000 })

  const entry = { viewport: `${w}x${h}`, overflow }
  report.errors.push(...errors)

  // Open a blade and confirm it fits within the viewport.
  const box0 = await page.locator('canvas').boundingBox()
  const cw = box0.width / 2 + box0.x
  const ch = box0.height / 2 + box0.y
  await page.mouse.click(cw, ch)
  await page.waitForTimeout(2500)
  entry.bladeOpened = await bladeOpen(page)
  if (entry.bladeOpened) {
    const bb = await bladeBox(page)
    entry.bladeFits =
      bb && bb.x >= 0 && bb.y >= 0 && bb.x + bb.width <= w + 1 && bb.y + bb.height <= h + 1
    entry.blade = `${Math.round(bb.x)},${Math.round(bb.y)} ${Math.round(bb.width)}x${Math.round(bb.height)}`
    await page.screenshot({ path: `${OUT}/${w}x${h}-blade.png`, animations: 'disabled' })
    if (w >= 1024) {
      // Blade must clear the telemetry rail (left-8 … left-8+w-60 ⇒ ends at 272px).
      entry.bladeClearsRail = bb.x >= 272
    }
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  }
  report.viewports.push(entry)
  await page.close()
}

// ---------------------------------------------------------------------------
// 2. Mobile gesture semantics (390×844).
// ---------------------------------------------------------------------------
{
  const { page, errors } = await newPage(390, 844)
  await page.goto(`${arg}?q=raw`, { waitUntil: 'load' })
  await page.waitForTimeout(6500)
  report.errors.push(...errors)

  const diag = {}
  diag.name0 = await capsuleName(page)

  // 2a. Pill arrows must browse, not open.
  await page.locator('button[aria-label="Next Section"]').click()
  await page.waitForTimeout(1200)
  diag.afterNext = await capsuleName(page)
  diag.nextDoesNotOpen = !(await bladeOpen(page))

  // 2b. A horizontal drag must switch cards but keep the blade closed.
  const box = await page.locator('canvas').boundingBox()
  const y0 = box.y + box.height * 0.45
  await page.mouse.move(box.x + box.width * 0.72, y0)
  await page.mouse.down()
  for (let d = 1; d <= 6; d++) {
    const x = box.x + box.width * 0.72 - d * 20
    await page.mouse.move(x, y0 + 4, { steps: 3 })
    await page.waitForTimeout(30)
  }
  await page.mouse.up()
  await page.waitForTimeout(1200)
  diag.afterDrag = await capsuleName(page)
  diag.dragDoesNotOpen = !(await bladeOpen(page))
  diag.swipeChangedSection = diag.afterDrag !== diag.afterNext

  // 2c. A clean tap must open the blade.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(2500)
  diag.tapOpens = await bladeOpen(page)
  diag.bladeInBounds = false
  if (diag.tapOpens) {
    const bb = await page
      .locator('section[aria-label="Node Inspector"]')
      .boundingBox()
    diag.bladeInBounds =
      bb && bb.x >= 0 && bb.y >= 0 && bb.x + bb.width <= 391 && bb.y + bb.height <= 845
  }

  // 2d. Blade footer arrows switch content in place (blade stays open).
  if (diag.tapOpens) {
    const before = await page.locator('section[aria-label="Node Inspector"]').innerText()
    await page.locator('button[aria-label="Next card"]').click()
    await page.waitForTimeout(1200)
    const stillOpen = await bladeOpen(page)
    const after = stillOpen ? await page.locator('section[aria-label="Node Inspector"]').innerText() : ''
    diag.footerSwitchesContent = after.length > 0 && after !== before
    diag.bladeStaysOpen = await bladeOpen(page)
  }

  // 2e. Expand button opens the blade from the capsule.
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await page.locator('button[aria-label="Expand current card"]').click()
  await page.waitForTimeout(2500)
  diag.expandOpens = await bladeOpen(page)

  report.interactions.mobile = diag
  await page.close()
}

// ---------------------------------------------------------------------------
// 3. Desktop pill/tap sanity at 1280.
// ---------------------------------------------------------------------------
{
  const { page, errors } = await newPage(1280, 800)
  await page.goto(`${arg}?q=raw`, { waitUntil: 'load' })
  await page.waitForTimeout(6500)
  report.errors.push(...errors)
  const box = await page.locator('canvas').boundingBox()
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.42)
  await page.waitForTimeout(900)
  report.interactions.desktop = { tapOpens: await bladeOpen(page) }
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  report.interactions.desktop.escapeCloses = !(await bladeOpen(page))
  await page.close()
}

console.log(JSON.stringify(report, null, 2))
await browser.close()