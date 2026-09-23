// Verifies the configurator finish actually reaches the 3D materials.
// Usage: node scripts/probe-finish.mjs (preview on 4174 must be serving dist)
import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
})
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await page.goto('http://127.0.0.1:4174/#buy', { waitUntil: 'load' })
await page.waitForSelector('#buy', { timeout: 30000 })
await page.locator('#buy [data-testid="pencil-viewer"]').scrollIntoViewIfNeeded()
await page.waitForSelector('[data-testid="pencil-canvas"]', { timeout: 30000 })
await page.waitForTimeout(3000)
for (const finish of ['graphite', 'steel', 'brass']) {
  await page.getByTestId(`finish-${finish}`).click()
  await page.waitForTimeout(2500)
  const name = await page.getByTestId('finish-name').textContent()
  const colors = await page.evaluate(() => {
    const w = window
    const scene = w.__scene
    if (scene === undefined) return 'no __scene'
    const rows = []
    scene.traverse((o) => {
      if (!o.isMesh) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of mats) {
        if (m.name !== 'pencil:barrel' && m.name !== 'pencil:grip') continue
        rows.push(`${m.name}=${m.color.getHexString()}`)
        break
      }
      if (rows.length >= 2) return
    })
    return [...new Set(rows)].join(' ')
  })
  console.log(`${finish}: ui=[${name}] mats: ${colors}`)
  const diag = await page.evaluate(() => ({
    inner: window.__pencilFinish ?? null,
    scene: window.__pencilSceneFinish ?? null,
  }))
  console.log(`  diag: inner=${diag.inner} scene=${diag.scene}`)
}
await browser.close()
