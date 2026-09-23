import { mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

// Bounded M5 evidence run: 13 act screenshots plus a full-runway scroll FPS
// sample. Desktop 1280x800, DPR 1. Writes docs/film-snaps/act-<id>.png.
const ACTS = [
  ['hero', 0.05],
  ['detail', 0.18],
  ['exploded-stack', 0.29],
  ['exploded-0-lead', 0.308],
  ['exploded-2-nose', 0.34],
  ['exploded-3-clutch', 0.356],
  ['exploded-4-grip', 0.372],
  ['exploded-5-shaft', 0.388],
  ['exploded-6-spring', 0.404],
  ['exploded-7-barrel', 0.42],
  ['exploded-8-clip', 0.436],
  ['exploded-9-cap', 0.452],
  ['xray', 0.54],
  ['mechanism', 0.685],
  ['reassembly', 0.8],
  ['final', 0.95],
]

mkdirSync('docs/film-snaps', { recursive: true })
const server = spawn(
  'cmd',
  ['/c', 'node_modules\\.bin\\vite preview --port 4176 --strictPort --host 127.0.0.1'],
  { stdio: 'ignore' },
)
await new Promise((resolve) => setTimeout(resolve, 3500))
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 200))
})
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))

for (const [id, t] of ACTS) {
  await page.goto(`http://127.0.0.1:4176/?t=${t}`)
  await page.waitForTimeout(2500)
  // Re-scroll against settled layout: the mount-time ?t= mapping runs
  // before lazy chunks and fonts stop shifting the runway height, so it
  // lands short. Second mapping is exact; then let damping converge.
  await page.evaluate(() => {
    const runway = document.querySelector('[data-testid="film-runway"]')
    if (runway === null) return
    const rect = runway.getBoundingClientRect()
    const top = rect.top + window.scrollY
    const tt = Number.parseFloat(new URLSearchParams(window.location.search).get('t') ?? '0')
    window.scrollTo({ top: top + tt * (rect.height - window.innerHeight), behavior: 'instant' })
  })
  await page.waitForTimeout(3500)
  await page.screenshot({ path: `docs/film-snaps/act-${id}.png` })
  console.log(`captured act-${id} at t=${t}`)
}

// Scroll FPS sample across the whole runway.
await page.goto('http://127.0.0.1:4176/')
await page.waitForTimeout(2500)
const fps = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const start = performance.now()
      let frames = 0
      let worst = 0
      let last = start
      const tick = (now) => {
        worst = Math.max(worst, now - last)
        last = now
        frames += 1
        window.scrollTo(0, Math.min(max, (max * (now - start)) / 20000))
        if (now - start < 21000) requestAnimationFrame(tick)
        else resolve({ frames, seconds: (now - start) / 1000, worstMs: worst })
      }
      requestAnimationFrame(tick)
    }),
)
console.log(
  `scroll fps: ${(fps.frames / fps.seconds).toFixed(1)} avg, worst frame ${fps.worstMs.toFixed(1)}ms (SwiftShader CPU GL)`,
)
console.log(`console errors: ${errors.length}`)
for (const e of errors.slice(0, 10)) console.log('  ERR', e)
await browser.close()
server.kill()
