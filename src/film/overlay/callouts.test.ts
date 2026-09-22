import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { layoutCallouts, type CalloutDef } from './callouts.ts'

const DEFS: CalloutDef[] = [
  { partId: 'die', title: 'Die', body: '3 nm', priority: 1 },
  { partId: 'cell', title: 'Cell', body: '4000 mAh', priority: 2 },
]

function camera(): THREE.PerspectiveCamera {
  const cam = new THREE.PerspectiveCamera(24, 16 / 9, 0.01, 10)
  cam.position.set(0, 0, 0.62)
  cam.lookAt(0, 0, 0)
  cam.updateMatrixWorld(true)
  return cam
}

describe('layoutCallouts', () => {
  it('projects anchors to screen pixels', () => {
    const worlds = new Map([
      ['die', new THREE.Vector3(0, 0, 0)],
      ['cell', new THREE.Vector3(0, -0.05, 0)],
    ])
    const layouts = layoutCallouts(DEFS, worlds, camera(), 1440, 900)
    expect(layouts).toHaveLength(2)
    for (const layout of layouts) {
      expect(layout.visible).toBe(true)
      expect(layout.x).toBeGreaterThan(40)
      expect(layout.x).toBeLessThan(1400)
    }
    // Cell sits below die on screen.
    const die = layouts.find((l) => l.partId === 'die')
    const cell = layouts.find((l) => l.partId === 'cell')
    expect(cell?.y).toBeGreaterThan(die?.y ?? 0)
  })

  it('culls behind-camera and off-screen anchors', () => {
    const worlds = new Map([
      ['die', new THREE.Vector3(0, 0, 2)],
      ['cell', new THREE.Vector3(50, 50, 0)],
    ])
    const layouts = layoutCallouts(DEFS, worlds, camera(), 1440, 900)
    expect(layouts.every((l) => !l.visible)).toBe(true)
  })

  it('hides the lower-priority label on collision', () => {
    const worlds = new Map([
      ['die', new THREE.Vector3(0, 0, 0)],
      ['cell', new THREE.Vector3(0.0005, 0.0005, 0)],
    ])
    const layouts = layoutCallouts(DEFS, worlds, camera(), 1440, 900)
    const visible = layouts.filter((l) => l.visible)
    expect(visible).toHaveLength(1)
    expect(visible[0]?.partId).toBe('die')
  })

  it('hides unknown parts without throwing', () => {
    const layouts = layoutCallouts(DEFS, new Map(), camera(), 1440, 900)
    expect(layouts.every((l) => !l.visible)).toBe(true)
  })
})
