// Homepage artifact survey: screenshots at multiple scroll positions.
// Usage: node scripts/survey.mjs
import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
})
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(String(err)))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text().slice(0, 160))
})
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'load' })
await page.waitForTimeout(3000)
// Scroll through the page in steps, settling each time.
const height = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
for (const [i, frac] of [0, 0.15, 0.3, 0.5, 0.7, 0.9, 1].entries()) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), height * frac)
  await page.waitForTimeout(2500)
  await page.screenshot({
    path: `C:\\Users\\Aaron\\AppData\\Local\\Temp\\opencode\\survey-${i}.png`,
  })
}
console.log(`errors: ${errors.length}`)
for (const e of errors.slice(0, 10)) console.log(e)
await browser.close()
