import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
})
for (const t of ['0.356', '0.388', '0.42']) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto(`http://127.0.0.1:4174/?t=${t}`, { waitUntil: 'load' })
  await page.waitForSelector('[data-testid="film-chapter"]', { timeout: 30000 })
  await page.waitForTimeout(5000)
  await page.evaluate(() => {
    const runway = document.querySelector('[data-testid="film-runway"]')
    if (runway === null) return
    const rect = runway.getBoundingClientRect()
    const top = rect.top + window.scrollY
    const tt = Number.parseFloat(new URLSearchParams(window.location.search).get('t') ?? '0')
    window.scrollTo({ top: top + tt * (rect.height - window.innerHeight), behavior: 'instant' })
  })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: `C:\\Users\\Aaron\\aether-graph\\docs\\film-snaps\\beat-${t}.png` })
  console.log(`captured beat-${t} (errors: ${errors.length})`)
  await context.close()
}
await browser.close()
