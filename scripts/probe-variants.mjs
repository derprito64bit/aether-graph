// Verifies one-wheel-step paging across the finish showroom.
// Usage: node scripts/probe-variants.mjs (preview on 4174 must be serving dist)
import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
})
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errors = []
page.on('pageerror', (err) => errors.push(String(err)))
await page.goto('http://127.0.0.1:4174/', { waitUntil: 'load' })
await page.waitForSelector('#family', { timeout: 30000 })
await page.locator('#family').scrollIntoViewIfNeeded()
await page.waitForTimeout(1500)
const heading = async () => {
  const info = {}
  for (const name of ['Graphite', 'Steel', 'Brass']) {
    info[name] = await page.getByRole('heading', { name }).boundingBox()
  }
  info.scrollY = await page.evaluate(() => window.scrollY)
  return JSON.stringify(info)
}
console.log('start:', await heading())
await page.mouse.move(720, 450)
await page.mouse.wheel(0, 240)
await page.waitForTimeout(1800)
console.log('after 1 wheel:', await heading())
await page.mouse.wheel(0, 240)
await page.waitForTimeout(1800)
console.log('after 2 wheels:', await heading())
await page.screenshot({ path: 'docs/film-snaps/variants-paged.png' })
console.log('errors:', errors.length, errors.slice(0, 3))
await browser.close()
