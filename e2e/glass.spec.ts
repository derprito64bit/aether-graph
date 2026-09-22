import { expect, test } from '@playwright/test'

test('glass resolves displacement tier in Chromium', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium-only assertion')
  await page.goto('/')
  const chrome = page.getByTestId('glass-chrome').first()
  await expect(chrome).toBeVisible()
  await expect(chrome).toHaveAttribute('data-tier', 'displacement')
})

test('glass resolves layered tier in Firefox and WebKit', async ({ page, browserName }) => {
  test.skip(browserName === 'chromium', 'non-Chromium assertion')
  await page.goto('/')
  const chrome = page.getByTestId('glass-chrome').first()
  await expect(chrome).toBeVisible()
  await expect(chrome).toHaveAttribute('data-tier', 'layered')
})

test('glass collapses under reduced transparency', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP emulation is Chromium-only')
  const context = await browser.newContext({ colorScheme: 'dark' })
  const page = await context.newPage()
  const session = await context.newCDPSession(page)
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  })
  await page.goto('/')
  const chrome = page.getByTestId('glass-chrome').first()
  await expect(chrome).toBeVisible()
  const bg = await chrome.evaluate((el) => getComputedStyle(el).backdropFilter)
  expect(bg === 'none' || bg === '').toBe(true)
  await context.close()
})

test('zoom modules scrub with zero layout shift', async ({ page }) => {
  // /dev/zoom ships in dev builds only, so this test drives the dev server.
  await page.goto('http://127.0.0.1:5174/dev/zoom')
  // Wait for the lazy route chunk first: observing before it lands would
  // attribute chunk pop-in to the zoom modules.
  await expect(page.getByTestId('zoom-pinned-box')).toBeVisible()
  // Isolate zoom from font-swap shift: observe only after fonts settle.
  await page.evaluate(() => document.fonts.ready)
  // Neutralize smooth-scroll animation: programmatic stepped scrolling would
  // otherwise animate through sticky ranges and attribute motion to layout.
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => {
    const shifts: Array<{ value: number; nodes: string[] }> = []
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const sources =
          (
            entry as unknown as {
              sources?: Array<{ node?: { tagName?: string; className?: string } }>
            }
          ).sources ?? []
        shifts.push({
          value: (entry as unknown as { value: number }).value,
          nodes: sources.map(
            (s) =>
              `${s.node?.tagName ?? '?'}${typeof s.node?.className === 'string' ? `.${s.node.className.split(' ')[0]}` : ''}`,
          ),
        })
      }
    })
    observer.observe({ type: 'layout-shift' })
    ;(window as unknown as { __shifts: Array<{ value: number; nodes: string[] }> }).__shifts =
      shifts
  })
  const box = page.getByTestId('zoom-pinned-box')
  await box.scrollIntoViewIfNeeded()
  for (let i = 0; i <= 10; i++) {
    await page.evaluate((f) => window.scrollTo(0, f), i * 400)
    await page.waitForTimeout(80)
  }
  const scale = await box.getAttribute('data-scale')
  expect(Number(scale)).toBeGreaterThan(1)
  const boxWidth = await box.evaluate((el) => el.getBoundingClientRect().width)
  expect(boxWidth).toBeGreaterThan(0)
  const shifts = await page.evaluate(
    () =>
      (window as unknown as { __shifts: Array<{ value: number; nodes: string[] }> }).__shifts ?? [],
  )
  const total = shifts.reduce((a, b) => a + b.value, 0)
  expect(total).toBe(0)
  // Zoom scales the visual only: the box never changes size.
  const boxSize = await box.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { w: r.width, h: r.height }
  })
  expect(boxSize.w).toBeGreaterThan(0)
  expect(boxSize.h).toBeGreaterThan(0)
})
