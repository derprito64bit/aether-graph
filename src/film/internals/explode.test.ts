import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  ASSEMBLY_CENTROID,
  EXPLODE_DIRECTIONS,
  EXPLODE_PARTS,
  REMOVAL_ORDER,
  explodeVector,
  partProgress,
} from './explode.ts'

describe('explode registry', () => {
  it('derives unit directions with the interior stack pointing rearward', () => {
    for (const part of EXPLODE_PARTS) {
      const dir = EXPLODE_DIRECTIONS[part.id]
      expect(dir, part.id).toBeDefined()
      if (dir !== undefined) expect(dir.length()).toBeCloseTo(1, 6)
    }
    const optics = EXPLODE_DIRECTIONS['lens-main']
    expect(optics?.z).toBeLessThan(0)
    const coil = EXPLODE_DIRECTIONS['charge-coil']
    expect(coil?.z).toBeLessThan(0)
  })

  it('fans screws almost purely radial while panels lift almost straight', () => {
    const screw = EXPLODE_PARTS.find((p) => p.id === 'screw-0')
    const panel = EXPLODE_PARTS.find((p) => p.id === 'graphite-sheet')
    expect(screw?.radialMix).toBeGreaterThan(0.8)
    expect(panel?.radialMix).toBeLessThan(0.2)
    const out = new THREE.Vector3()
    explodeVector([0.05, 0.01, 0], ASSEMBLY_CENTROID, 0.45, -1, out)
    expect(out.x).toBeGreaterThan(0.3)
    explodeVector([-0.05, 0.01, -0.004], ASSEMBLY_CENTROID, 0.45, -1, out)
    expect(out.x).toBeLessThan(-0.3)
    expect(out.z).toBeLessThan(0)
  })

  it('lets removal order dominate with radial distance breaking ties', () => {
    let maxDelay = 0
    for (const part of EXPLODE_PARTS) {
      expect(part.delay).toBeGreaterThanOrEqual(0)
      expect(part.delay).toBeLessThanOrEqual(0.45)
      maxDelay = Math.max(maxDelay, part.delay)
    }
    expect(maxDelay).toBeGreaterThan(0.3)
    const byId = new Map(EXPLODE_PARTS.map((p) => [p.id, p]))
    // Outer layers leave before inner ones: coil before cell, cell before board.
    expect(byId.get('charge-coil')?.delay).toBeLessThan(byId.get('cell')?.delay ?? 1)
    expect(byId.get('cell')?.delay).toBeLessThan(byId.get('main-board')?.delay ?? 1)
    // The battery goes straight back with no tumble: it is heavy.
    expect(byId.get('cell')?.radialMix).toBeLessThanOrEqual(0.1)
    expect(byId.get('cell')?.tumble).toBeUndefined()
  })

  it('keeps every delay inside the removal-order ladder', () => {
    expect(REMOVAL_ORDER[0]).toBe('rear-panel')
    for (const part of EXPLODE_PARTS) {
      expect(part.order).toBeGreaterThanOrEqual(0)
      expect(part.order).toBeLessThan(REMOVAL_ORDER.length)
    }
  })

  it('staggers parts as a wave through partProgress', () => {
    expect(partProgress(0, 0.2)).toBe(0)
    expect(partProgress(1, 0.2)).toBe(1)
    // Same master value, different delays: the wave, not a pop.
    expect(partProgress(0.5, 0)).toBeGreaterThan(partProgress(0.5, 0.4))
    expect(partProgress(0.4, 0.45)).toBe(0)
  })

  it('registers the full Prompt C manifest', () => {
    const ids = EXPLODE_PARTS.map((p) => p.id)
    for (const id of [
      'nfc',
      'charge-coil',
      'graphite-sheet',
      'screw-0',
      'screw-7',
      'shield-lid',
      'shield-fence',
      'vapor-chamber',
      'coax-l',
      'coax-r',
      'btb-flex',
      'cell',
      'cell-wrap',
      'sub-board',
      'haptic',
      'speaker',
      'main-board',
      'nand',
      'substrate',
      'die',
      'bga-array',
      'decoupling-cluster',
      'camera-module',
      'lens-main',
      'lens-ultra',
      'lens-mid',
      'lens-periscope',
      'sensor-stack',
      'tof-module',
    ]) {
      expect(ids, id).toContain(id)
    }
  })
})
