import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { skipWithoutWebGL } from './webgl.ts'

const ROUTES = ['/', '/specifications', '/not-a-page']

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

test('axe clean on a film chapter with a numeral', async ({ page }) => {
  // The route pass above only sees the hero, which has no numeral, so the
  // numeral markup (BigNumeral) gets its own steady-state check.
  await page.goto('/?t=0.18')
  await skipWithoutWebGL(page)
  await expect(page.getByTestId('film-numeral')).toBeVisible({ timeout: 15000 })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1200)
  const results = await new AxeBuilder({ page }).include('[data-testid="film-chapter"]').analyze()
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([])
})
