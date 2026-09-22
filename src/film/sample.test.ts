import { describe, expect, it } from 'vitest'
import { filmKeys, sampleFilm } from './sample.ts'

describe('timeline sampler', () => {
  it('lands every authored key at its authored progress', () => {
    for (const k of filmKeys()) {
      const s = sampleFilm(k.at)
      expect(s.pos.x).toBeCloseTo(k.camera.pos[0], 3)
      expect(s.pos.y).toBeCloseTo(k.camera.pos[1], 3)
      expect(s.pos.z).toBeCloseTo(k.camera.pos[2], 3)
      expect(s.target.x).toBeCloseTo(k.camera.target[0], 3)
      expect(s.target.y).toBeCloseTo(k.camera.target[1], 3)
      expect(s.target.z).toBeCloseTo(k.camera.target[2], 3)
      expect(s.rx).toBeCloseTo(k.pose.rx, 6)
      expect(s.ry).toBeCloseTo(k.pose.ry, 6)
      expect(s.fov).toBeCloseTo(k.lens.fov, 6)
    }
  })

  it('reuses one scratch object across samples (zero allocation)', () => {
    const first = sampleFilm(0.42)
    for (let i = 0; i < 10000; i++) {
      const s = sampleFilm((i % 1000) / 1000)
      expect(s).toBe(first)
    }
  })

  it('stays continuous under fine sampling (no camera slam)', () => {
    // Segment-aware: no single frame may cover more than a fraction of its
    // own segment travel. Fast authored whips (macro exits) pass because
    // their chord is long; a true discontinuity has no chord and fails.
    const keys = filmKeys()
    for (let s = 0; s < keys.length - 1; s++) {
      const a = keys[s]
      const b = keys[s + 1]
      if (a === undefined || b === undefined) continue
      const span = b.at - a.at
      const sub = 40
      // Snapshot immediately: sampleFilm reuses one scratch object.
      const sa = sampleFilm(a.at)
      const startPos = sa.pos.clone()
      const startTgt = sa.target.clone()
      const startFov = sa.fov
      const sb = sampleFilm(b.at)
      const posChord = startPos.distanceTo(sb.pos)
      const tgtChord = startTgt.distanceTo(sb.target)
      const fovChord = Math.abs(sb.fov - startFov)
      let prevPos = startPos.clone()
      let prevTgt = startTgt.clone()
      let prevFov = startFov
      for (let i = 1; i <= sub; i++) {
        const p = sampleFilm(a.at + (span * i) / sub)
        expect(p.pos.distanceTo(prevPos)).toBeLessThan(Math.max(0.02, posChord * 0.3))
        expect(p.target.distanceTo(prevTgt)).toBeLessThan(Math.max(0.02, tgtChord * 0.3))
        expect(Math.abs(p.fov - prevFov)).toBeLessThan(Math.max(0.5, fovChord * 0.3))
        prevPos = p.pos.clone()
        prevTgt = p.target.clone()
        prevFov = p.fov
      }
    }
  })

  it('respects FOV clamps across the range', () => {
    for (let i = 0; i <= 200; i++) {
      const s = sampleFilm(i / 200)
      expect(s.fov).toBeGreaterThanOrEqual(10)
      expect(s.fov).toBeLessThanOrEqual(52)
      expect(s.fovMax).toBeGreaterThan(0)
      expect(s.fovMax).toBeLessThanOrEqual(60)
    }
  })

  it('passes non-hold keys at speed instead of stalling (round 01 A5)', () => {
    // Per-segment smoothstep drives velocity to ~0 at every key (14x-785x
    // collapse pre-fix). Linear segments hold speed: FOV is exactly 1x, and
    // camera speed varies only by authored slope changes and reclock span
    // jumps (worst 10.7x at the 0.95 ai-exit whip, still continuous).
    // One-sided speeds so authored extrema (e.g. an FOV peak exactly on a
    // key) do not read as stalls; true stalls are ~0 from both sides.
    const h = 5e-4
    const snap = (p: number): { px: number; py: number; pz: number; fov: number } => {
      const s = sampleFilm(Math.min(1, Math.max(0, p)))
      return { px: s.pos.x, py: s.pos.y, pz: s.pos.z, fov: s.fov }
    }
    const easeAts = new Set(
      filmKeys()
        .filter((k) => k.ease === 'smooth')
        .map((k) => k.at),
    )
    for (let i = 1; i < filmKeys().length - 1; i++) {
      const k = filmKeys()[i]!
      if (easeAts.has(k.at)) continue
      const a = snap(k.at - h)
      const b = snap(k.at)
      const c = snap(k.at + h)
      const posAt = Math.max(
        Math.hypot(b.px - a.px, b.py - a.py, b.pz - a.pz) / h,
        Math.hypot(c.px - b.px, c.py - b.py, c.pz - b.pz) / h,
      )
      const fovAt = Math.max(Math.abs(b.fov - a.fov) / h, Math.abs(c.fov - b.fov) / h)
      const m = snap(k.at - 0.006)
      const n = snap(k.at - 0.006 + 2 * h)
      const posBefore = Math.hypot(n.px - m.px, n.py - m.py, n.pz - m.pz) / (2 * h)
      const fovBefore = Math.abs(n.fov - m.fov) / (2 * h)
      if (fovBefore > 1e-6) {
        expect(fovBefore / Math.max(fovAt, 1e-9), `fov collapse at ${k.at}`).toBeLessThan(2)
      }
      if (posBefore > 1e-6) {
        expect(posBefore / Math.max(posAt, 1e-9), `pos collapse at ${k.at}`).toBeLessThan(12)
      }
    }
  })
})
