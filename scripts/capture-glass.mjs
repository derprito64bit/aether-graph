import { mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium, firefox, webkit } from '@playwright/test'

// Bounded tier-evidence run for docs/glass.md. Navbar-pill closeups.
mkdirSync('docs/glass-snaps', { recursive: true })
const server = spawn(
  'cmd',
  ['/c', 'node_modules\\.bin\\vite preview --port 4178 --strictPort --host 127.0.0.1'],
  { stdio: 'ignore' },
)
await new Promise((resolve) => setTimeout(resolve, 3500))
const clip = { x: 0, y: 0, width: 1280, height: 140 }

for (const [name, launcher] of [
  ['tier-displacement', chromium],
  ['tier-layered-firefox', firefox],
  ['tier-layered-webkit', webkit],
]) {
  const browser = await launcher.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto('http://127.0.0.1:4178/')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `docs/glass-snaps/${name}.png`, clip })
  console.log(`captured ${name}`)
  await browser.close()
}

{
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    forcedColors: 'active',
  })
  await page.goto('http://127.0.0.1:4178/')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'docs/glass-snaps/tier-forced-colors.png', clip })
  console.log('captured tier-forced-colors')
  await browser.close()
}

{
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  const session = await context.newCDPSession(page)
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  })
  await page.goto('http://127.0.0.1:4178/')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'docs/glass-snaps/tier-reduced-transparency.png', clip })
  console.log('captured tier-reduced-transparency')
  await browser.close()
}
server.kill()
