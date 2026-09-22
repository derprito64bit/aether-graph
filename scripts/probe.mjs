// One-off probe: reports film state + pencil material opacities at a ?t= value.
// Usage: node scripts/probe.mjs 0.69
import { chromium } from 'playwright-core'

const t = process.argv[2] ?? '0.69'
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
})
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errors = []
page.on('pageerror', (err) => errors.push(String(err)))
await page.goto(`http://127.0.0.1:4173/?t=${t}`, { waitUntil: 'load' })
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
const act = await page.getByTestId('film-chapter').getAttribute('data-act')
console.log('chapter act:', act)
const report = await page.evaluate(() => {
  const w = window
  const scene = w.__scene
  if (scene === undefined) return 'no __scene'
  const rows = new Map()
  scene.traverse((o) => {
    if (!o.isMesh) return
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    for (const m of mats) {
      if (!m.name.startsWith('pencil:')) continue
      rows.set(m.name, `op=${Number(m.opacity).toFixed(3)} dw=${m.depthWrite}`)
    }
  })
  return [...rows.entries()].map(([k, v]) => `${k} ${v}`).join('\n')
})
console.log(report)
console.log('errors:', errors.length, errors.slice(0, 3))
await browser.close()
