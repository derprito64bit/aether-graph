import { describe, expect, it } from 'vitest'
import type * as THREE from 'three'
import {
  barrelGeometry,
  barrelThreadGeometry,
  capGeometry,
  chuckRingGeometry,
  clipBeadGeometry,
  clipGeometry,
  clutchSpringGeometry,
  eraserGeometry,
  gripGeometry,
  gripThreadGeometry,
  jawGeometry,
  knockGeometry,
  knurlBandGeometry,
  leadGeometry,
  leadPointGeometry,
  noseGeometry,
  ringGeometry,
  shaftGeometry,
  sleeveGeometry,
  spareLeadGeometry,
  springGeometry,
  type PencilDetail,
} from './pencilGeometry.ts'

function triangles(g: THREE.BufferGeometry): number {
  const index = g.getIndex()
  return (index !== null ? index.count : g.getAttribute('position').count) / 3
}

/** Every geometry PencilModel mounts, with the jaw counted three times. */
function pencilTriangles(detail: PencilDetail): number {
  const parts: THREE.BufferGeometry[] = [
    barrelGeometry(detail),
    barrelThreadGeometry(detail),
    noseGeometry(detail),
    gripGeometry(detail),
    gripThreadGeometry(detail),
    sleeveGeometry(detail),
    capGeometry(detail),
    knockGeometry(detail),
    ringGeometry(detail),
    shaftGeometry(detail),
    spareLeadGeometry(detail),
    leadGeometry(detail),
    leadPointGeometry(detail),
    springGeometry(detail),
    chuckRingGeometry(detail),
    clutchSpringGeometry(detail),
    clipGeometry(detail),
    clipBeadGeometry(detail),
    eraserGeometry(detail),
  ]
  if (detail === 'high') parts.push(knurlBandGeometry())
  let total = parts.reduce((sum, g) => sum + triangles(g), 0)
  total += 3 * triangles(jawGeometry(detail))
  for (const g of parts) g.dispose()
  return total
}

describe('pencil triangle budget', () => {
  it('keeps the high-detail pencil inside the 120k device budget', () => {
    expect(pencilTriangles('high')).toBeLessThan(120_000)
  })

  it('keeps the low-detail pencil far lighter for coarse pointers', () => {
    expect(pencilTriangles('low')).toBeLessThan(pencilTriangles('high') / 2)
  })

  it('builds threads and the knurl band as indexed, non-empty surfaces', () => {
    for (const g of [
      barrelThreadGeometry('high'),
      gripThreadGeometry('high'),
      knurlBandGeometry(),
    ]) {
      expect(triangles(g)).toBeGreaterThan(500)
      expect(g.getAttribute('uv')).toBeDefined()
      g.dispose()
    }
  })
})
