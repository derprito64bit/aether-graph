import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const ROUTES = ['/', '/cameras', '/performance', '/display', '/software', '/specifications']

for (const route of ROUTES) {
  test(`axe clean on ${route}`, async ({ page }) => {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Let entrance motion settle: axe must judge the steady state, never a
    // mid-crossfade frame (partial opacity reads as low contrast).
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(600)
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([])
  })
}
