import { expect, test } from '@playwright/test'

// Runs only in the mobile-chromium project (playwright.config.ts).

for (const route of ['/', '/specifications']) {
  test(`no horizontal overflow on ${route}`, async ({ page }) => {
    await page.goto(route)
    await page.evaluate(() => document.fonts.ready)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('buy stays in the nav and the menu reaches every page', async ({ page }) => {
  // DOM only: the static story keeps CI's software GL (the film's scene
  // compile behind the loader) out of the menu's budget.
  await page.goto('/?nogl')
  await expect(page.getByTestId('nav-buy')).toBeVisible()
  const menu = page.getByTestId('nav-menu')
  await menu.click()
  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('link', { name: 'Specs' }).click()
  await expect(page).toHaveURL(/\/specifications$/)
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
})
