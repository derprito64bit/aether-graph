// Material rolls for diagnosing wash: sets props on the film material set.
// Usage: node scripts/roll.mjs <url> <prop=value>...  (single film page)
import { chromium } from 'playwright-core'

const [url, ...assigns] = process.argv.slice(2)
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
})
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
await page.goto(url, { waitUntil: 'load' })
await page.waitForSelector('[data-testid="film-chapter"]', { timeout: 30000 })
await page.waitForTimeout(5000)
for (const assign of assigns) {
  const [path, raw] = assign.split('=')
  const result = await page.evaluate(
    ([p, v, isColor]) => {
      const mats = window.__mats
      if (mats === undefined) return 'no-mats'
      const [matName, prop] = p.split('.')
      const mat = mats[matName]
      if (mat === undefined) return 'no-mat'
      if (isColor) mat[prop].set(v)
      else {
        mat[prop] = Number(v)
        mat.needsUpdate = true
      }
      return `ok ${matName}.${prop}`
    },
    [path, raw, raw.startsWith('#')],
  )
  console.log(result)
}
await page.waitForTimeout(1200)
await page.screenshot({ path: 'C:\\Users\\Aaron\\AppData\\Local\\Temp\\opencode\\roll.png' })
console.log('done')
await browser.close()
