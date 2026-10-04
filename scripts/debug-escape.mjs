import { chromium } from 'playwright'

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 900, height: 560 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

await page.goto('http://localhost:5174?q=raw', { waitUntil: 'load' })
await page.waitForTimeout(7000)

const open = () => page.evaluate(() => document.body.innerText.includes('CASE FILE'))

await page.locator('nav button').nth(1).click()
await page.waitForTimeout(3500)

const box = await page.locator('canvas').boundingBox()
await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.45)
await page.waitForTimeout(700)

const afterClick = await open()

// Where is focus after clicking the canvas?
const focus = await page.evaluate(() => {
  const el = document.activeElement
  return { tag: el?.tagName, id: el?.id, cls: el?.className?.toString?.().slice(0, 40) }
})

await page.keyboard.press('Escape')
await page.waitForTimeout(700)
const afterEscapeCanvasFocus = await open()

// Try again with focus explicitly on body.
await page.evaluate(() => document.activeElement?.blur())
await page.keyboard.press('Escape')
await page.waitForTimeout(500)
const afterEscapeBlur = await open()

// And via the panel's own close affordance.
const closeBtn = page.locator('aside button')
const closeExists = await closeBtn.count()
let afterCloseBtn = null
if (closeExists) {
  await closeBtn.click()
  await page.waitForTimeout(500)
  afterCloseBtn = await open()
}

console.log(
  JSON.stringify(
    { afterClick, focus, afterEscapeCanvasFocus, afterEscapeBlur, closeExists, afterCloseBtn, errors },
    null,
    2,
  ),
)
await browser.close()