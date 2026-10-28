import { expect, test } from '@playwright/test'
import { skipWithoutWebGL } from './webgl.ts'

test('film runway renders chapters without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/')
  await skipWithoutWebGL(page)
  const runway = page.getByTestId('film-runway')
  await expect(runway).toBeVisible()
  await expect(page.getByTestId('film-chapter')).toBeVisible()
  await expect(page.getByTestId('film-chapter')).toHaveAttribute('data-act', 'hero')
  expect(errors).toEqual([])
})

test('film ?t= deep link jumps to the exploded act', async ({ page }) => {
  await page.goto('/?t=0.38')
  await skipWithoutWebGL(page)
  const chapter = page.getByTestId('film-chapter')
  await expect(chapter).toBeVisible()
  await expect(chapter).toHaveAttribute('data-act', 'exploded', { timeout: 15000 })
})

test('the film opens as a sketch and the drawing retires after the reveal', async ({ page }) => {
  // Counts the ink layers SketchReveal mounts on the film pencil through
  // the read-only probe hook (FilmScene). Drawn at t=0, hidden once the
  // render front has cleared the crown, so they cost nothing afterwards.
  const visibleSketch = () =>
    page.evaluate(() => {
      const scene = (
        window as unknown as { __scene?: { traverse: (f: (o: unknown) => void) => void } }
      ).__scene
      if (scene === undefined) return -1
      let count = 0
      scene.traverse((o) => {
        const obj = o as { userData: { sketch?: boolean }; visible: boolean }
        if (obj.userData.sketch === true && obj.visible) count++
      })
      return count
    })
  await page.goto('/?t=0')
  await skipWithoutWebGL(page)
  await expect.poll(visibleSketch, { timeout: 20000 }).toBeGreaterThan(0)
  await page.evaluate(() => {
    const runway = document.querySelector('[data-testid="film-runway"]')
    if (runway === null) return
    const rect = runway.getBoundingClientRect()
    window.scrollTo({
      top: rect.top + window.scrollY + 0.2 * (rect.height - window.innerHeight),
      behavior: 'instant',
    })
  })
  await expect.poll(visibleSketch, { timeout: 10000 }).toBe(0)
})

test('film static fallback renders every act without WebGL', async ({ page }) => {
  await page.goto('/?nogl=1')
  const fallback = page.getByTestId('film-fallback')
  await expect(fallback).toBeVisible()
  await expect(fallback.getByRole('heading', { level: 2 }).first()).toBeVisible()
})

test('reduced motion tells the teardown in stills (round 01 A7)', async ({ browser }) => {
  // Reduced motion bypasses the WebGL film for the static story, which
  // carries all ten teardown layers with their copy (Film.tsx).
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('/?t=0.38')
  const fallback = page.getByTestId('film-fallback')
  await expect(fallback).toBeVisible()
  await expect(page.getByText('Motion is reduced on this device')).toBeVisible()
  await expect(page.locator('[aria-label="Teardown layer clutch"]')).toBeVisible()
  await expect(page.locator('[aria-label="Teardown layer cap"]')).toBeVisible()
  await context.close()
})
