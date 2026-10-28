import type { PencilPartId } from '../../components/PencilViewer/pencilDimensions.ts'

/**
 * Part manifest for the Aether Graph 0.5 exploded assembly. Order is the
 * physical stack tip to crown: lead, fixed sleeve, nose cone, clutch, grip,
 * reservoir shaft, spring, barrel, clip, cap. Each layer owns exactly one
 * PencilModel group. The index is the part number on the drawing's
 * balloons and in the parts list, and the order of the feature run. Where
 * each part sits in the drawing lives in assembly.ts.
 */
export interface TeardownLayer {
  id: PencilPartId
  /** Stack index, 0 = tipmost. Part number minus one. */
  index: number
  /** PencilModel groups travelling with this layer. */
  shell: ReadonlyArray<PencilPartId>
  /** Copy key into TEARDOWN_COPY in chapters.ts. */
  copyKey: string
  /** Accent hue for this layer's rim light and the stage tint. */
  accent: string
}

const LAYER_ACCENTS: Record<PencilPartId, string> = {
  lead: '#7a7268',
  sleeve: '#5f7486',
  nose: '#4f545b',
  clutch: '#96702c',
  grip: '#47617a',
  shaft: '#5f656d',
  spring: '#6e6a5e',
  barrel: '#8a5a2c',
  clip: '#7c6a4f',
  cap: '#a05a3c',
}

const ORDER: readonly PencilPartId[] = [
  'lead',
  'sleeve',
  'nose',
  'clutch',
  'grip',
  'shaft',
  'spring',
  'barrel',
  'clip',
  'cap',
]

export const TEARDOWN_LAYERS: TeardownLayer[] = ORDER.map((id, index) => ({
  id,
  index,
  shell: [id],
  copyKey: id,
  accent: LAYER_ACCENTS[id],
}))

/**
 * Master-progress to continuous layer cursor 0..10. Ten feature windows of
 * 0.016 across 0.30 to 0.46: integer part is the featured part, fraction
 * is its local progress. Pure: reverses exactly.
 */
export function cursorAt(p: number): number {
  return Math.min(10, Math.max(0, (p - 0.3) / 0.016))
}
