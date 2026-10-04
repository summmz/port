import { chromium } from 'playwright'

const arg = process.argv[2] ?? 'http://localhost:4173'

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})

const page = await browser.newPage({ viewport: { width: 900, height: 560 } })

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`[console] ${m.text()}`)
})
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))

await page.goto(`${arg}?q=raw`, { waitUntil: 'load' })
await page.waitForTimeout(7000)

const detailOpen = () =>
  page.evaluate(() => document.body.innerText.includes('CASE FILE'))

const navState = () =>
  page.evaluate(() => {
    const current = [...document.querySelectorAll('nav button')].findIndex((b) =>
      b.getAttribute('aria-current') === 'page',
    )
    return current
  })

const report = { navClicks: [], cardHits: [], escapeCloses: false, domClicks: [], errors }

// 1. Every nav button should move the section and mark aria-current.
const navCount = await page.locator('nav button').count()
for (let i = 0; i < navCount; i++) {
  await page.locator('nav button').nth(i).click()
  await page.waitForTimeout(2200)
  report.navClicks.push({
    label: await page.locator('nav button').nth(i).innerText(),
    activeIndex: await navState(),
  })
}

// 2. Go to WORK and sweep the canvas looking for a clickable card.
await page.locator('nav button').nth(1).click()
await page.waitForTimeout(3500)

const box = await page.locator('canvas').boundingBox()
let hits = 0
for (let gx = 1; gx <= 6; gx++) {
  for (let gy = 1; gy <= 4; gy++) {
    const x = box.x + (box.width * gx) / 7
    const y = box.y + (box.height * gy) / 5
    await page.mouse.move(x, y)
    await page.waitForTimeout(120)
    const cursor = await page.evaluate(() => document.body.style.cursor)
    await page.mouse.click(x, y)
    await page.waitForTimeout(600)
    if (await detailOpen()) {
      hits++
      const linkCount = await page.locator('aside a').count()
      report.cardHits.push({ x: Math.round(x), y: Math.round(y), links: linkCount })
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    }
    if (cursor === 'pointer') report.domClicks.push({ x: Math.round(x), y: Math.round(y) })
  }
}

report.cardHits = report.cardHits.slice(0, 12)
report.hoverablePoints = report.domClicks.length
report.domClicks = report.domClicks.slice(0, 20)

// 3. Escape must close the detail panel.
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2.6)
await page.waitForTimeout(500)
if (await detailOpen()) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  report.escapeCloses = !(await detailOpen())
}

report.overflowScrollable = await page.evaluate(
  () => document.documentElement.scrollHeight > window.innerHeight + 2,
)
report.horizontalScroll = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth + 2,
)

console.log(JSON.stringify(report, null, 2))
await browser.close()