import { expect, test } from '@playwright/test'

test('home renders without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(errors).toEqual([])
})

test('skip link moves focus to main', async ({ page, browserName }) => {
  await page.goto('/')
  const link = page.getByRole('link', { name: /skip to content/i })
  if (browserName === 'webkit') {
    // Headless WebKit neither tabs to links (platform keyboard-access
    // setting) nor navigates on synthetic click. Keyboard Enter on the
    // focused link is the genuine operability path.
    await link.focus()
    await expect(link).toBeFocused()
    await page.keyboard.press('Enter')
  } else {
    await page.keyboard.press('Tab')
    await expect(link).toBeFocused()
    await link.click()
  }
  await expect(page).toHaveURL(/#main/)
})
