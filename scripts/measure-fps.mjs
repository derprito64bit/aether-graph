import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

// Dev-only idle FPS probe for the M3 gate. Headless Chromium renders WebGL
// through SwiftShader (CPU), so this is a lower bound, not a device claim.
const server = spawn(
  process.platform === 'win32' ? 'cmd' : 'npx',
  process.platform === 'win32'
    ? ['/c', 'node_modules\\.bin\\vite preview --port 4174 --strictPort --host 127.0.0.1']
    : ['vite', 'preview', '--port', '4174', '--strictPort', '--host', '127.0.0.1'],
  { stdio: 'ignore' },
)

await new Promise((resolve) => setTimeout(resolve, 3500))
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('http://127.0.0.1:4174/')
const viewer = page.getByTestId('phone-viewer').first()
await viewer.scrollIntoViewIfNeeded()
await page.getByTestId('phone-canvas').first().waitFor({ timeout: 20000 })
const result = await page.evaluate(
  () =>
    new Promise((resolve) => {
      let frames = 0
      let worst = 0
      let last = performance.now()
      const start = last
      const tick = (now) => {
        worst = Math.max(worst, now - last)
        last = now
        frames += 1
        if (now - start < 3000) requestAnimationFrame(tick)
        else resolve({ frames, seconds: (now - start) / 1000, worstMs: worst })
      }
      requestAnimationFrame(tick)
    }),
)
console.log(
  `idle fps: ${(result.frames / result.seconds).toFixed(1)} over ${result.seconds.toFixed(1)}s (worst frame ${result.worstMs.toFixed(1)}ms, SwiftShader CPU GL)`,
)
await browser.close()
server.kill()
