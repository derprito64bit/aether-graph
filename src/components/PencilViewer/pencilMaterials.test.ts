import { beforeAll, describe, expect, it } from 'vitest'
import type { PencilFinishId } from '../../data/pencil.ts'
import {
  PENCIL_FINISH_PARAMS,
  createPencilMaterials,
  disposePencilMaterials,
  type PencilMaterialSet,
} from './pencilMaterials.ts'

/** The material properties that pick a shader program (defines), per part. */
function programFeatures(set: PencilMaterialSet): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [part, m] of Object.entries(set)) {
    out[part] = [
      m.clearcoat > 0 ? 'clearcoat' : '',
      m.sheen > 0 ? 'sheen' : '',
      m.transmission > 0 ? 'transmission' : '',
      m.iridescence > 0 ? 'iridescence' : '',
      m.anisotropy > 0 ? 'anisotropy' : '',
      m.map !== null ? 'map' : '',
      m.roughnessMap !== null ? 'roughnessMap' : '',
      m.normalMap !== null ? 'normalMap' : '',
      m.transparent ? 'transparent' : '',
    ].join(' ')
  }
  return out
}

// jsdom has no 2D canvas. The textures only need to be built, not drawn: a
// context whose every method is a no-op, with the few return shapes they read.
beforeAll(() => {
  const image = (w: number, h: number) => ({
    width: w,
    height: h,
    data: new Uint8ClampedArray(Math.max(1, w * h * 4)),
  })
  const known: Record<string, unknown> = {
    measureText: () => ({ width: 1 }),
    createImageData: image,
    getImageData: (_x: number, _y: number, w: number, h: number) => image(w, h),
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    createRadialGradient: () => ({ addColorStop: () => undefined }),
  }
  const ctx = new Proxy(
    {},
    {
      get: (_target, prop) => known[String(prop)] ?? (() => undefined),
      set: () => true,
    },
  )
  HTMLCanvasElement.prototype.getContext = (() => ctx) as never
})

describe('pencil materials', () => {
  // A finish change must swap uniforms and textures only: a different define
  // compiles new programs, a multi-second hitch on software GL.
  it('every finish compiles to the same shader programs', () => {
    const ids = Object.keys(PENCIL_FINISH_PARAMS) as PencilFinishId[]
    const sets = ids.map((id) => createPencilMaterials(PENCIL_FINISH_PARAMS[id]))
    const reference = programFeatures(sets[0] as PencilMaterialSet)
    for (const set of sets) expect(programFeatures(set)).toEqual(reference)
    for (const set of sets) disposePencilMaterials(set)
  })
})
