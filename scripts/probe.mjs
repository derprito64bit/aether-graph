// One-off probe: reports film state + pencil material opacities at a ?t= value.
// Usage: PORT=4174 node scripts/probe.mjs 0.69
import { chromium } from 'playwright-core'

const PORT = process.env.PORT ?? '4173'
const t = process.argv[2] ?? '0.69'
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
})
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
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
const layout = await page.evaluate(() => {
  const w = window
  const scene = w.__scene
  if (scene === undefined) return 'no __scene'
  const v = new (Object.getPrototypeOf(scene.position).constructor)()
  const rows = []
  scene.traverse((o) => {
    if (!o.isMesh) return
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    const names = mats.map((m) => m.name || '?').join(',')
    if (!names.startsWith('pencil:')) return
    o.getWorldPosition(v)
    rows.push(
      `${o.geometry.type} mat=${names} op=${mats.map((m) => Number(m.opacity).toFixed(2)).join(',')} vis=${o.visible} wpos=${v.toArray().map((x) => Number(x).toFixed(4)).join(',')}`,
    )
  })
  return rows.join('\n')
})
console.log('--- layout ---')
console.log(layout)
const ndc = await page.evaluate(() => {
  const w = window
  const scene = w.__scene
  const cam = w.__cam
  if (scene === undefined || cam === undefined) return 'no scene/cam'
  const v = new (Object.getPrototypeOf(scene.position).constructor)()
  const rows = []
  rows.push(
    `cam pos=${cam.position.toArray().map((x) => Number(x).toFixed(4)).join(',')} fov=${cam.fov}`,
  )
  scene.traverse((o) => {
    if (!o.isMesh) return
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    const names = mats.map((m) => m.name || '?').join(',')
    if (!names.startsWith('pencil:')) return
    o.getWorldPosition(v)
    const p = v.clone().project(cam)
    rows.push(
      `${o.geometry.type} mat=${names} ndc=${p.toArray().map((x) => Number(x).toFixed(3)).join(',')}`,
    )
  })
  return rows.join('\n')
})
console.log('--- ndc ---')
console.log(ndc)
const anchors = await page.evaluate(() => {
  const w = window
  const scene = w.__scene
  if (scene === undefined) return 'no __scene'
  const out = []
  scene.traverse((o) => {
    if (o.name !== 'pencil') return
  })
  return `traverse-ok`
})
console.log(anchors)
console.log('errors:', errors.length, errors.slice(0, 3))
await browser.close()
