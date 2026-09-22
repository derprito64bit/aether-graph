// Crop a region from a PNG for review. Usage:
// node scripts/crop.mjs in.png out.png fx fy fw fh  (fractions 0..1)
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const [input, output, fx, fy, fw, fh] = process.argv.slice(2)
const bytes = readFileSync(input).toString('base64')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.setContent(
  `<body style="margin:0;background:#000"><img id="im" src="data:image/png;base64,${bytes}" style="width:1280px"></body>`,
)
await page.waitForTimeout(800)
const box = await page.evaluate(() => {
  const el = document.getElementById('im')
  const r = el.getBoundingClientRect()
  return { x: r.x, y: r.y, width: r.width, height: r.height }
})
const fxn = Number(fx)
const fyn = Number(fy)
const fwn = Number(fw)
const fhn = Number(fh)
await page.screenshot({
  path: output,
  clip: {
    x: box.x + box.width * fxn,
    y: box.y + box.height * fyn,
    width: box.width * fwn,
    height: box.height * fhn,
  },
})
await browser.close()
console.log(`wrote ${output}`)
