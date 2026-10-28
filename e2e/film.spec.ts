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

test('the exploded view numbers every part and tracks the featured one', async ({ page }) => {
  // t = 0.358 sits inside part 4's feature window (cursor 3.6).
  await page.goto('/?t=0.358')
  await skipWithoutWebGL(page)
  const chapter = page.getByTestId('film-chapter')
  await expect(chapter).toHaveAttribute('data-act', 'exploded', { timeout: 15000 })
  const balloons = page.getByTestId('assembly-balloons')
  await expect(balloons.locator('.balloon')).toHaveCount(10)
  // The balloons follow the 3D scene, which boots slowly on a software-GL
  // CI runner: same budget as the sketch test below.
  await expect
    .poll(() => balloons.evaluate((el) => Number(getComputedStyle(el).opacity)), {
      timeout: 20000,
    })
    .toBeGreaterThan(0.9)
  await expect(balloons.locator('.balloon[data-part="clutch"]')).toHaveAttribute(
    'data-active',
    'true',
    { timeout: 10000 },
  )
  const bom = page.getByTestId('bom')
  await expect(bom.locator('li')).toHaveCount(10)
  await expect(bom.locator('li[aria-current="step"]')).toContainText('Clutch')
  await expect(chapter).toContainText('Part 4')
  // Past the act every part is home: no balloons, no parts list.
  await page.goto('/?t=0.54')
  await expect(chapter).toHaveAttribute('data-act', 'xray', { timeout: 15000 })
  await expect
    .poll(() => balloons.evaluate((el) => Number(getComputedStyle(el).opacity)), {
      timeout: 20000,
    })
    .toBe(0)
  await expect(page.getByTestId('bom')).toHaveCount(0)
})

test('a deep link into the exploded view draws the same layout as scrolling there', async ({
  page,
}) => {
  // Regression: the parts were measured on the first frame, after the model
  // had already opened its sub-assemblies for the load position, so a deep
  // link drew a different picture than scrolling to the same spot.
  type Probe = {
    getObjectByName(
      n: string,
    ): { position: { x: number; y: number; z: number }; scale: { x: number } } | undefined
  }
  const layout = () =>
    page.evaluate(() => {
      const scene = (window as unknown as { __scene?: Probe }).__scene
      if (scene === undefined) return null
      const ids = ['sleeve', 'nose', 'grip', 'barrel', 'cap', 'clutch', 'shaft', 'spring']
      const out: number[] = []
      for (const id of ids) {
        const g = scene.getObjectByName(`part:${id}`)
        if (g === undefined) return null
        out.push(g.position.x, g.position.y, g.position.z, g.scale.x)
      }
      return out
    })
  const settleAt = async (t: number) => {
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(1500)
    await page.evaluate((tt) => {
      const runway = document.querySelector('[data-testid="film-runway"]')
      if (runway === null) return
      const r = runway.getBoundingClientRect()
      const top = r.top + window.scrollY + tt * (r.height - window.innerHeight)
      window.scrollTo({ top, behavior: 'instant' })
    }, t)
    await page.waitForTimeout(1500)
  }
  await page.goto('/?t=0.358')
  await skipWithoutWebGL(page)
  await expect.poll(layout, { timeout: 20000 }).not.toBeNull()
  await settleAt(0.358)
  const deepLinked = await layout()
  await page.goto('/?t=0.2')
  await expect.poll(layout, { timeout: 20000 }).not.toBeNull()
  await settleAt(0.358)
  const scrolled = await layout()
  expect(deepLinked).not.toBeNull()
  expect(scrolled).not.toBeNull()
  // Parts are out in the drawing, not at rest.
  expect(Math.abs(deepLinked?.[1] ?? 0)).toBeGreaterThan(0.001)
  deepLinked?.forEach((v, i) => expect(Math.abs(v - (scrolled?.[i] ?? NaN))).toBeLessThan(1e-5))
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
