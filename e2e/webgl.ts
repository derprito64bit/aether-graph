import { test, type Page } from '@playwright/test'

/**
 * Skips a film test when the browser runner has no WebGL. Headless Firefox
 * on the Linux CI runner has none, and the site then correctly serves the
 * static story instead of the film; that path has its own test
 * ('film static fallback renders every act without WebGL'). Call after the
 * first navigation so the probe runs in a real document.
 */
export async function skipWithoutWebGL(page: Page): Promise<void> {
  const available = await page.evaluate(() => {
    try {
      const canvas = document.createElement('canvas')
      return canvas.getContext('webgl2') !== null || canvas.getContext('webgl') !== null
    } catch {
      return false
    }
  })
  test.skip(!available, 'No WebGL in this browser runner; the static story is tested separately.')
}
