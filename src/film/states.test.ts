import { describe, expect, it } from 'vitest'
import { computeFilmStates, layerWindow, ramplike } from './states.ts'

describe('film states', () => {
  it('opens no x-ray window at rest', () => {
    const s = computeFilmStates(0)
    expect(s.shellGhost).toBe(0)
    expect(s.internalOpacity).toBe(0)
    expect(s.explodeXray).toBe(0)
    expect(s.chipFocus).toBe(0)
  })

  it('holds the shell solid through separation, ghosting only the x-ray act', () => {
    expect(computeFilmStates(0.26).shellGhost).toBe(0)
    expect(computeFilmStates(0.29).shellGhost).toBe(0)
    expect(computeFilmStates(0.38).shellGhost).toBe(0)
    const hold = computeFilmStates(0.54)
    expect(hold.shellGhost).toBeGreaterThan(0.9)
    expect(hold.internalOpacity).toBeGreaterThan(0.9)
  })

  it('restores the shell after the x-ray act', () => {
    for (const p of [0.62, 0.8, 1]) {
      const s = computeFilmStates(p)
      if (p === 1) continue
      expect(s.shellGhost).toBe(0)
    }
    const end = computeFilmStates(1)
    expect(end.internalOpacity).toBe(0)
    expect(end.explodeXray).toBe(0)
  })

  it('focuses the shaft on its feature, then releases', () => {
    // Layer 5 runs p in [0.38, 0.396].
    expect(computeFilmStates(0.388).chipFocus).toBeCloseTo(1, 4)
    expect(computeFilmStates(0.388).chipLift).toBeCloseTo(1, 4)
    expect(computeFilmStates(0.35).chipFocus).toBe(0)
    expect(computeFilmStates(0.42).chipFocus).toBe(0)
    expect(computeFilmStates(0.5).chipFocus).toBe(0)
  })

  it('opens a layerWindow across one layer with lead and tail', () => {
    expect(layerWindow(5, 5, 0.5, 0.5)).toBe(1)
    expect(layerWindow(5.5, 5, 0.5, 0.5)).toBe(1)
    expect(layerWindow(4.5, 5, 0.5, 0.5)).toBe(0)
    expect(layerWindow(6.5, 5, 0.5, 0.5)).toBe(0)
    const mid = layerWindow(4.75, 5, 0.5, 0.5)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
  })

  it('ramps plateaus up, holds, and descends', () => {
    expect(ramplike(0, 0.2, 0.3, 0.7, 0.8)).toBe(0)
    expect(ramplike(0.5, 0.2, 0.3, 0.7, 0.8)).toBe(1)
    expect(ramplike(1, 0.2, 0.3, 0.7, 0.8)).toBe(0)
    const mid = ramplike(0.25, 0.2, 0.3, 0.7, 0.8)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
  })

  it('keeps every scalar inside [0,1] across the whole film', () => {
    for (let i = 0; i <= 1000; i++) {
      const s = computeFilmStates(i / 1000)
      for (const [name, value] of Object.entries(s)) {
        if (name === 'layerCursor') {
          expect(value, `${name} at p=${i / 1000}`).toBeGreaterThanOrEqual(0)
          expect(value, `${name} at p=${i / 1000}`).toBeLessThanOrEqual(10)
          continue
        }
        expect(value, `${name} at p=${i / 1000}`).toBeGreaterThanOrEqual(0)
        expect(value, `${name} at p=${i / 1000}`).toBeLessThanOrEqual(1)
      }
    }
  })

  it('returns every scalar to 0 at the end except layerCursor', () => {
    const end = computeFilmStates(1)
    for (const [name, value] of Object.entries(end)) {
      // The cursor parks at the last layer: a monotonic journey, not a window.
      if (name === 'layerCursor') expect(value).toBe(10)
      else expect(value, name).toBe(0)
    }
  })

  it('opens the optics beat with the camera dive', () => {
    expect(computeFilmStates(0.66).explodeOptics).toBeGreaterThan(0.5)
    expect(computeFilmStates(0.55).explodeOptics).toBe(0)
    expect(computeFilmStates(0.75).explodeOptics).toBe(0)
  })

  it('pulls focus and atmosphere at the macro holds', () => {
    expect(computeFilmStates(0.2).focusPull).toBeGreaterThan(0.5)
    expect(computeFilmStates(0.68).focusPull).toBeGreaterThan(0.5)
    expect(computeFilmStates(0.68).macroAtmos).toBeGreaterThan(0.5)
    expect(computeFilmStates(0.5).focusPull).toBe(0)
  })

  it('shows callouts only inside the exploded diagram', () => {
    expect(computeFilmStates(0.4).calloutOpacity).toBeGreaterThan(0.5)
    expect(computeFilmStates(0.2).calloutOpacity).toBe(0)
    expect(computeFilmStates(0.6).calloutOpacity).toBe(0)
  })

  it('keeps retired phone channels at zero across the whole film', () => {
    // Battery, energy, coil, shield, and screen lifts drove phone
    // internals that do not exist on the pencil. They must never fire.
    for (const p of [0, 0.15, 0.3, 0.38, 0.5, 0.65, 0.8, 1]) {
      const s = computeFilmStates(p)
      expect(s.battLift, `battLift at ${p}`).toBe(0)
      expect(s.energy, `energy at ${p}`).toBe(0)
      expect(s.coilRing, `coilRing at ${p}`).toBe(0)
      expect(s.shieldLift, `shieldLift at ${p}`).toBe(0)
      expect(s.explodeBatt, `explodeBatt at ${p}`).toBe(0)
      expect(s.screenOn, `screenOn at ${p}`).toBe(0)
    }
  })
})
