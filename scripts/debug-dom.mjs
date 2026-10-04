import { chromium } from "playwright"
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })
const p = await b.newPage({ viewport: { width: 900, height: 560 } })
await p.goto("http://localhost:5174?q=raw", { waitUntil: "load" })
await p.waitForTimeout(7000)
await p.locator("nav button").nth(1).click()
await p.waitForTimeout(3000)
const box = await p.locator("canvas").boundingBox()
await p.mouse.click(box.x + box.width/2, box.y + box.height*0.45)
await p.waitForTimeout(800)
console.log(JSON.stringify(await p.evaluate(() => ({
  asides: document.querySelectorAll("aside").length,
  asideHtml: document.querySelector("aside")?.outerHTML.slice(0, 600) ?? null,
  buttonsInAside: document.querySelectorAll("aside button").length,
  allButtonLabels: [...document.querySelectorAll("button")].map(x => (x.textContent||"").trim().slice(0,18)),
})), null, 2))
await b.close()
