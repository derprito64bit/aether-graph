import { describe, expect, it } from 'vitest'
import { key } from './key.ts'
import { KEYS } from './timeline.ts'
import { validateTimeline } from './validate.ts'

describe('timeline validator', () => {
  it('accepts the authored timeline with zero issues', () => {
    expect(validateTimeline(KEYS)).toEqual([])
  })

  it('rejects a missing endpoint', () => {
    const trimmed = KEYS.slice(1)
    const rules = validateTimeline(trimmed).map((i) => i.rule)
    expect(rules).toContain('starts-at-0')
  })

  it('rejects non-increasing progress', () => {
    const dup = [...KEYS]
    const prev = dup[4]
    const victim = dup[5]
    if (prev === undefined || victim === undefined) throw new Error('test needs at least 6 keys')
    dup[5] = key({
      at: prev.at,
      pose: { ...victim.pose },
      camera: { pos: [...victim.camera.pos], target: [...victim.camera.target] },
      lens: { ...victim.lens },
      look: { ...victim.look },
    })
    const rules = validateTimeline(dup).map((i) => i.rule)
    expect(rules).toContain('strictly-increasing')
  })

  it('treats MAX_GAP as inclusive with float tolerance (round 01 A8)', () => {
    // The teardown 0.34 -> 0.40 pair sits exactly on MAX_GAP by design;
    // no filler key was added for it. Moving the 0.40 key breaks no other
    // rule (no act boundary nearby), isolating the gap comparison.
    const atIssues = (at: number): string[] => {
      const moved = KEYS.map((k) => (k.at === 0.4 ? { ...k, at } : k))
      return validateTimeline(moved).map((i) => i.rule)
    }
    expect(atIssues(0.4)).not.toContain('max-gap')
    expect(atIssues(0.4 + 1e-12)).not.toContain('max-gap')
    expect(atIssues(0.401)).toContain('max-gap')
  })

  it('rejects an out-of-range fit target', () => {
    const bad = KEYS.map((k) => (k.at === 0.1 ? { ...k, lens: { ...k.lens, fit: 2 } } : k))
    const rules = validateTimeline(bad).map((i) => i.rule)
    expect(rules).toContain('fit-range')
  })

  it('rejects a NaN channel', () => {
    const bad = KEYS.map((k, i) => (i === 3 ? { ...k, pose: { ...k.pose, rx: Number.NaN } } : k))
    const rules = validateTimeline(bad).map((i) => i.rule)
    expect(rules).toContain('no-nan')
  })
})
