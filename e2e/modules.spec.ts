import { expect, test } from '@playwright/test'
import { skipWithoutWebGL } from './webgl.ts'

test('configurator changes finish and price', async ({ page }) => {
  await page.goto('/#buy')
  await page.getByTestId('finish-brass').click()
  await expect(page.getByTestId('finish-name')).toContainText('Brass')
  await expect(page.getByTestId('finish-brass')).toHaveAttribute('aria-pressed', 'true')
  await page.getByTestId('lead-07').click()
  await expect(page.getByTestId('buy-price')).toContainText('$126')
})

test('add to bag answers honestly in a live region', async ({ page }) => {
  await page.goto('/#buy')
  await page.getByTestId('finish-steel').click()
  await page.getByTestId('add-to-bag').click()
  await expect(page.getByRole('status').filter({ hasText: 'checkout ends here' })).toContainText(
    'Steel, 0.5 mm, $94',
  )
})

test('choosing a finish carries it into the purchase deck', async ({ page }) => {
  await page.goto('/#finishes')
  await page.getByTestId('choose-ember').click()
  await expect(page.locator('#buy')).toBeFocused()
  await expect(page.getByTestId('finish-name')).toContainText('Ember')
  await expect(page.getByTestId('buy-price')).toContainText('$98')
})

test('hero buy link jumps to the purchase deck', async ({ page }) => {
  await page.goto('/')
  await skipWithoutWebGL(page)
  await page.getByTestId('hero-buy').click()
  await expect(page).toHaveURL(/#buy$/)
  await expect(page.locator('#buy')).toBeFocused()
})

test('specifications page carries the pencil sheet', async ({ page }) => {
  await page.goto('/specifications')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Every dimension, on the record.' }),
  ).toBeVisible()
  await expect(page.getByTestId('technical-drawing')).toBeVisible()
  await expect(page.getByTestId('spec-highlights')).toContainText('142')
  await expect(page.getByTestId('spec-highlights')).toContainText('0.05')
  // Regression: the page used to render the phone's sheet.
  await expect(page.getByText('mAh')).toHaveCount(0)
  await expect(page.getByText('Aether One')).toHaveCount(0)
})

test('retired phone routes land on the not-found page', async ({ page }) => {
  for (const route of ['/cameras', '/software']) {
    await page.goto(route)
    await expect(
      page.getByRole('heading', { level: 1, name: 'This page is not on the drawing.' }),
    ).toBeVisible()
  }
})

test('film numerals keep their decimals', async ({ page }) => {
  // Regression: count-ups rounded 0.4 mm to "0" and 0.6 mm to "1".
  await page.goto('/?t=0.18')
  await skipWithoutWebGL(page)
  await expect(page.getByTestId('film-chapter')).toHaveAttribute('data-act', 'detail', {
    timeout: 15000,
  })
  await expect(page.getByLabel('0.4 mm knurl')).toBeVisible()
  await expect(page.getByLabel('0.4 mm knurl')).toContainText('0.4')
})
