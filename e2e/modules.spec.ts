import { expect, test } from '@playwright/test'

test('OS simulator opens and closes an app', async ({ page }) => {
  await page.goto('/software')
  await page.getByTestId('os-app-camera').click()
  await expect(page.getByTestId('os-app-screen')).toBeVisible()
  await page.getByTestId('os-app-close').click()
  await expect(page.getByTestId('os-app-screen')).toHaveCount(0)
})

test('OS quick settings toggle flips state', async ({ page }) => {
  await page.goto('/software')
  await page.getByTestId('os-shade-toggle').click()
  const toggle = page.getByTestId('os-toggle-wifi')
  const before = await toggle.getAttribute('data-on')
  await toggle.click()
  await expect(toggle).not.toHaveAttribute('data-on', before ?? '')
})

test('display demo responds to the Hz slider', async ({ page }) => {
  await page.goto('/display')
  const slider = page.locator('#hz-slider')
  await slider.fill('30')
  await expect(page.getByTestId('hz-readout')).toContainText('30')
})

test('SoC panel switches tabs', async ({ page }) => {
  await page.goto('/performance')
  await page.getByRole('tab', { name: 'GPU' }).click()
  await expect(page.getByTestId('soc-hero')).toContainText('132')
  await page.getByRole('tab', { name: 'NPU' }).click()
  await expect(page.getByTestId('soc-hero')).toContainText('46')
})

test('focal strip re-focuses the lens readout', async ({ page }) => {
  await page.goto('/cameras')
  await page.getByTestId('focal-5x').click()
  await expect(page.getByTestId('focal-detail')).toContainText('periscope')
})

test('configurator changes finish and price', async ({ page }) => {
  await page.goto('/#buy')
  await page.getByTestId('finish-brass').click()
  await expect(page.getByTestId('finish-name')).toContainText('Brass')
  await page.getByTestId('lead-07').click()
  await expect(page.getByTestId('buy-price')).toContainText('$126')
})
