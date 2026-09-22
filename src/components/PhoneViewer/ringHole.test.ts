import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { superellipsePoints } from '../../lib/superellipse.ts'
import { BEZEL, BODY_N, DIM } from './phoneDimensions.ts'
import { createFrameRingGeometry } from './phoneGeometry.ts'
import { assignRailGroups } from './phoneGeometry.ts'

/** The bezel ring must have an open display cutout at its center. */
function centerHits(geometry: THREE.BufferGeometry): number {
  const raycaster = new THREE.Raycaster()
  raycaster.set(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1))
  const mesh = new THREE.Mesh(geometry)
  mesh.updateMatrixWorld(true)
  return raycaster.intersectObject(mesh, false).length
}

describe('frame ring cutout', () => {
  it('leaves the display opening empty before rail grouping', () => {
    const geometry = createFrameRingGeometry()
    expect(centerHits(geometry)).toBe(0)
    geometry.dispose()
  })

  it('leaves the display opening empty after rail grouping', () => {
    const geometry = createFrameRingGeometry()
    assignRailGroups(geometry)
    expect(centerHits(geometry)).toBe(0)
    geometry.dispose()
  })

  it('phase-matches the inner loop to the outer loop (no pinwheel lid)', () => {
    // The annulus joins outer[i] to inner[i]. Both loops must start at
    // the +X axis and wind monotonically; a rotated start twists the lid
    // over the opening, where it z-fights with itself. The inner loop is
    // a superellipse in the body exponent family so the lid strip stays a
    // uniform width through the corners.
    const total = 256
    const inner = superellipsePoints(DIM.w / 2 - BEZEL * 0.95, DIM.h / 2 - BEZEL * 0.95, BODY_N, 64)
    expect(inner).toHaveLength(total)
    const first = inner[0] as [number, number]
    expect(Math.atan2(first[1], first[0])).toBeCloseTo(0, 1)
    let prev = -0.01
    for (const [x, y] of inner) {
      let a = Math.atan2(y ?? 0, x ?? 0)
      if (a < 0) a += Math.PI * 2
      expect(a).toBeGreaterThan(prev)
      prev = a
    }
    expect(prev).toBeLessThan(Math.PI * 2)
  })
})
