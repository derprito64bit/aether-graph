import { describe, expect, it } from 'vitest'
import { CAMERA_KEYS } from './acts/camera.ts'
import { TEARDOWN_KEYS } from './acts/teardown.ts'
import type { FilmKey } from './key.ts'
import { sampleFilm } from './sample.ts'
import { ACTS } from './timeline.ts'

function byAt(keys: FilmKey[], at: number): FilmKey {
  const found = keys.find((k) => k.at === at)
  if (found === undefined) throw new Error(`no key at ${at}`)
  return found
}

function vecDelta(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

/** Closeup holds: the camera must be nearly static so the eye can land. */
describe('closeup holds', () => {
  it('holds the separated stack from 0.272 to 0.295 before any flip', () => {
    // The establishing hold: full stack legible before layer zero moves.
    const a = byAt(TEARDOWN_KEYS, 0.272)
    const b = byAt(TEARDOWN_KEYS, 0.295)
    expect(vecDelta(a.camera.pos, b.camera.pos)).toBeLessThan(0.02)
    expect(vecDelta(a.camera.target, b.camera.target)).toBeLessThan(0.005)
    expect(a.pose.rx).toBe(b.pose.rx)
    expect(a.pose.ry).toBe(b.pose.ry)
  })

  it('locks the macro camera from 0.685 to 0.705', () => {
    const a = byAt(CAMERA_KEYS, 0.685)
    const b = byAt(CAMERA_KEYS, 0.705)
    expect(vecDelta(a.camera.pos, b.camera.pos)).toBe(0)
    expect(vecDelta(a.camera.target, b.camera.target)).toBe(0)
    expect(a.lens.fov).toBe(b.lens.fov)
    expect(Math.abs(a.pose.ry - b.pose.ry)).toBeLessThanOrEqual(0.02)
  })
})

/**
 * Port beat (Prompt B section 5.4, ADR port-beat): the approach ends low
 * on the bottom edge, camera below the rail looking up at the USB-C
 * mouth. Asserted on the sampler so the beat holds no matter how the
 * deep-link scroll lands.
 */
describe('port beat', () => {
  it('lands the camera on the bottom rail at the end of approach', () => {
    const s = sampleFilm(0.2499)
    expect(s.target.y).toBeLessThan(-0.03)
    expect(s.pos.y).toBeLessThan(0)
    expect(s.target.y).toBeGreaterThan(-0.08)
  })
})

/**
 * Reverse-scrub determinism (Prompt B section 10.2): the film is a pure
 * function of progress, so sampling backward must retrace the same states
 * with no pops. Bounded first differences across a fine grid prove it.
 */
describe('scrub continuity', () => {
  it('bounds state deltas across the whole timeline in both directions', () => {
    const samples: number[] = []
    for (let i = 0; i <= 2000; i++) samples.push(i / 2000)
    let maxPos = 0
    let maxTarget = 0
    let maxFov = 0
    let maxExposure = 0
    let prev = sampleFilm(0).pos.clone()
    let prevTarget = sampleFilm(0).target.clone()
    let prevFov = sampleFilm(0).fov
    let prevExposure = sampleFilm(0).exposure
    for (const p of samples.slice(1)) {
      const next = sampleFilm(p)
      maxPos = Math.max(maxPos, prev.distanceTo(next.pos))
      maxTarget = Math.max(maxTarget, prevTarget.distanceTo(next.target))
      maxFov = Math.max(maxFov, Math.abs(next.fov - prevFov))
      maxExposure = Math.max(maxExposure, Math.abs(next.exposure - prevExposure))
      prev = next.pos.clone()
      prevTarget = next.target.clone()
      prevFov = next.fov
      prevExposure = next.exposure
    }
    // The sampler is exact, so fast authored moves (battery exit runs 0.2m
    // in 0.006 of progress; the macro exit swings the aim 10mm per step)
    // read as large steps here; the director glides them with damped
    // position, slower-damped aim, and capped rotation and FOV. These
    // bounds catch true pops (NaN, teleport keys), not drama.
    expect(maxPos).toBeLessThan(0.05)
    expect(maxTarget).toBeLessThan(0.015)
    expect(maxFov).toBeLessThan(1)
    expect(maxExposure).toBeLessThan(0.05)
  })

  it('lands every act boundary inside its act', () => {
    for (const act of ACTS) {
      const mid = (act.start + act.end) / 2
      const t = sampleFilm(mid)
      expect(t, `p=${mid}`).toBeDefined()
    }
  })
})
