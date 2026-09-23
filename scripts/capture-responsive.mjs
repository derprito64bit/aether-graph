// Responsive + fallback evidence: mobile, tablet, nogl, reduced motion.
// Preview must already serve the current dist on 4173.
import { chromium } from 'playwright-core'

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
]

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
})

for (const vp of VIEWPORTS) {
  for (const [shot, url] of [
    ['arrival', `http://127.0.0.1:4174/?t=0.05`],
    ['exploded', `http://127.0.0.1:4174/?t=0.38`],
    ['buy', 'http://127.0.0.1:4174/#buy'],
  ]) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await page.goto(url, { waitUntil: 'load' })
    if (shot === 'buy') {
      await page.waitForSelector('#buy', { timeout: 30000 })
      await page.locator('#buy').scrollIntoViewIfNeeded()
      const buyViewer = page.locator('#buy [data-testid="pencil-viewer"]')
      await buyViewer.scrollIntoViewIfNeeded()
      await buyViewer.waitFor({ state: 'visible', timeout: 30000 })
    } else {
      await page.waitForSelector('[data-testid="film-chapter"]', { timeout: 30000 })
      await page.waitForTimeout(4000)
      await page.evaluate(() => {
        const runway = document.querySelector('[data-testid="film-runway"]')
        if (runway === null) return
        const rect = runway.getBoundingClientRect()
        const top = rect.top + window.scrollY
        const t = Number.parseFloat(new URLSearchParams(window.location.search).get('t') ?? '0')
        window.scrollTo({ top: top + t * (rect.height - window.innerHeight), behavior: 'instant' })
      })
    }
    await page.waitForTimeout(4000)
    await page.screenshot({ path: `docs/film-snaps/rsp-${vp.name}-${shot}.png` })
    console.log(`captured rsp-${vp.name}-${shot} (pageerrors: ${errors.length})`)
    for (const e of errors) console.log(e)
    await context.close()
  }
}

// Static fallbacks.
for (const [shot, url, check] of [
  ['nogl', 'http://127.0.0.1:4174/?nogl=1', '[data-testid="film-fallback"]'],
  ['reduced', 'http://127.0.0.1:4174/?t=0.4', '[data-testid="film-fallback"]'],
]) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...(shot === 'reduced' ? { reducedMotion: 'reduce' } : {}),
  })
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForSelector(check, { timeout: 30000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `docs/film-snaps/rsp-${shot}.png` })
  console.log(`captured rsp-${shot}`)
  await context.close()
}
await browser.close()
