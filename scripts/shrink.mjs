// Downscale a PNG for review. Usage: node scripts/shrink.mjs in.png out.png
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const [input, output] = process.argv.slice(2)
const bytes = readFileSync(input).toString('base64')
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] })
const page = await browser.newPage({ viewport: { width: 720, height: 450 } })
await page.setContent(`<img src="data:image/png;base64,${bytes}" style="width:700px">`)
await page.waitForTimeout(1200)
await page.screenshot({ path: output })
await browser.close()
console.log(`wrote ${output}`)
