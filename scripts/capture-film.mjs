import { mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

// Bounded M5 evidence run: 13 act screenshots plus a full-runway scroll FPS
// sample. Desktop 1280x800, DPR 1. Writes docs/film-snaps/act-<id>.png.
const ACTS = [
  ['arrival', 0.05],
  ['settle', 0.13],
  ['approach', 0.2],
  ['teardown-stack', 0.285],
  ['teardown-0-cover', 0.305],
  ['teardown-2-frame', 0.345],
  ['teardown-3-battery', 0.365],
  ['teardown-4-board', 0.385],
  ['teardown-5-silicon', 0.405],
  ['teardown-6-thermal', 0.425],
  ['teardown-7-coil', 0.445],
  ['teardown-8-camera', 0.465],
  ['teardown-9-rear', 0.485],
  ['camera', 0.66],
  ['display', 0.78],
  ['storage', 0.86],
  ['battery', 0.91],
  ['software', 0.94],
  ['ai', 0.96],
  ['final', 0.99],
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
