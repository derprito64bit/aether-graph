import { expect, test, type Page } from '@playwright/test'

/** Records every value the loading page's progressbar shows, from first paint. */
async function recordProgress(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const seen: number[] = []
    ;(window as unknown as { __aglSeen: number[] }).__aglSeen = seen
    const watch = (): void => {
      const el = document.getElementById('ag-loader')
      if (el === null) {
        requestAnimationFrame(watch)
        return
      }
      new MutationObserver(() => {
        const v = Number(el.getAttribute('aria-valuenow'))
        if (seen[seen.length - 1] !== v) seen.push(v)
      }).observe(el, { attributes: true, attributeFilter: ['aria-valuenow'] })
    }
    watch()
  })
}

async function expectHandedOver(page: Page): Promise<number[]> {
  await expect(page.locator('#ag-loader')).toHaveCount(0, { timeout: 30000 })
  await expect(page.locator('html')).not.toHaveAttribute('data-loading')
  return page.evaluate(() => (window as unknown as { __aglSeen: number[] }).__aglSeen)
}

test('the loading page counts up to 100 without going backwards, then hands over', async ({
  page,
}) => {
  await recordProgress(page)
  await page.goto('/')
  await expect(page.getByRole('progressbar', { name: 'Loading Aether Graph' })).toBeAttached()
  const seen = await expectHandedOver(page)
  expect(seen.length).toBeGreaterThan(3)
  expect(seen[seen.length - 1]).toBe(100)
  for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1] ?? 0)
})

test('the specifications page loads without the 3D engine', async ({ page }) => {
  const scripts: string[] = []
  page.on('request', (r) => {
    if (r.resourceType() === 'script') scripts.push(r.url())
  })
  await recordProgress(page)
  await page.goto('/specifications')
  const seen = await expectHandedOver(page)
  expect(seen[seen.length - 1]).toBe(100)
  // Regression: React used to share a chunk with r3f, which pulled all of
  // three.js onto every page.
  expect(scripts.filter((u) => /\/(three|r3f)-[^/]*\.js/.test(u))).toEqual([])
})

test('the nav shows the configured pencil', async ({ page }) => {
  await page.goto('/#buy')
  const price = page.getByTestId('nav-price')
  await expect(price).toContainText('From $86')
  await page.getByTestId('finish-brass').click()
  await expect(price).toContainText('Brass · $118')
  await page.getByTestId('lead-07').click()
  await expect(price).toContainText('Brass, 0.7 mm · $126')
})
