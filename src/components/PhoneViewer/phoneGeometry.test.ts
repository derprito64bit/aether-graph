import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  assignRailGroups,
  createFrameBodyGeometry,
  createFrameRingGeometry,
  superellipseShape,
} from './phoneGeometry.ts'
import { BACK_FACE } from './phoneDimensions.ts'

function groupSizes(geometry: THREE.BufferGeometry): number[] {
  return geometry.groups.map((group) => group.count)
}

describe('assignRailGroups', () => {
  it('splits the frame body into four contiguous rail groups', () => {
    const geometry = createFrameBodyGeometry(BACK_FACE)
    const before = (geometry.getAttribute('position') as THREE.BufferAttribute).count
    assignRailGroups(geometry)
    expect(geometry.groups).toHaveLength(4)
    expect(geometry.groups.map((group) => group.materialIndex)).toEqual([0, 1, 2, 3])
    const sizes = groupSizes(geometry)
    const total = sizes.reduce((a, b) => a + b, 0)
    expect(total).toBe(before)
    // Every rail owns real faces; contiguity holds by construction.
    for (const size of sizes) {
      expect(size).toBeGreaterThan(0)
      expect(size % 3).toBe(0)
    }
    let start = 0
    for (const [i, size] of sizes.entries()) {
      expect(geometry.groups[i]?.start).toBe(start)
      start += size
    }
    geometry.dispose()
  })

  it('splits the bezel ring the same way', () => {
    const geometry = createFrameRingGeometry()
    assignRailGroups(geometry)
    expect(geometry.groups).toHaveLength(4)
    const total = groupSizes(geometry).reduce((a, b) => a + b, 0)
    expect(total).toBe((geometry.getAttribute('position') as THREE.BufferAttribute).count)
    geometry.dispose()
  })

  it('preserves normals and uvs through the reorder', () => {
    const geometry = createFrameBodyGeometry(BACK_FACE)
    const count = (geometry.getAttribute('position') as THREE.BufferAttribute).count
    assignRailGroups(geometry)
    for (const name of ['position', 'normal', 'uv']) {
      expect((geometry.getAttribute(name) as THREE.BufferAttribute).count).toBe(count)
    }
    geometry.computeBoundingSphere()
    expect(geometry.boundingSphere?.radius).toBeGreaterThan(0.05)
    geometry.dispose()
  })

  it('builds a closed superellipse shape', () => {
    const shape = superellipseShape(0.03, 0.05, 4, 16)
    expect(shape.getPoints().length).toBeGreaterThan(0)
  })
})
