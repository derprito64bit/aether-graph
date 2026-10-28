import type { PencilPartId } from '../../components/PencilViewer/pencilDimensions.ts'

/**
 * Exploded assembly: the layout and envelopes for the exploded act, as pure
 * functions of measured part extents and master progress. No React, no
 * scene access: the director measures the parts once and writes the result.
 *
 * Layout. Two parallel rows in assembly space (the pencil's own frame: Y is
 * the long axis, tip to crown):
 * - shell row on the axis: sleeve, nose, grip (with ring), barrel, cap;
 * - mechanism row offset along +X: lead, clutch, shaft, spring;
 * - the clip floats above the barrel along -X, keeping its axial place.
 * Parts keep their tip-to-crown order inside each row with an even gap, so
 * the drawing reads like an engineering exploded view. The hero pose lays
 * the pencil horizontal on wide screens (+X then points down the screen)
 * and upright on tall ones.
 */

export type AssemblyPart = PencilPartId

export const SHELL_ROW: readonly AssemblyPart[] = ['sleeve', 'nose', 'grip', 'barrel', 'cap']
export const MECHANISM_ROW: readonly AssemblyPart[] = ['lead', 'clutch', 'shaft', 'spring']

/** Axial gap between neighbours in a row, metres (assembly space). */
export const ASSEMBLY_GAP = 0.011
/** Mechanism row offset along +X, metres. */
export const ROW_OFFSET = 0.022
/** Clip lift along -X above the barrel, metres. */
export const CLIP_LIFT = 0.0105

/** Axial extent of a part at rest, assembly space. */
export interface PartExtent {
  minY: number
  maxY: number
}

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface AssemblyLayout {
  /** Where each part's rest centre travels to, as an offset from rest. */
  offsets: Record<AssemblyPart, Vec3>
  /** Axial length of the longer row, metres. */
  length: number
  /** Lateral span from the clip to the mechanism row, metres. */
  span: number
  /** Axial centre the layout is built around (assembly space). */
  centerY: number
  /** Which row each part rides, for balloon placement. */
  rows: Record<AssemblyPart, 'shell' | 'mechanism' | 'clip'>
}

function zero(): Vec3 {
  return { x: 0, y: 0, z: 0 }
}

function rowLength(
  row: readonly AssemblyPart[],
  ext: Record<AssemblyPart, PartExtent>,
  gap: number,
): number {
  let total = 0
  for (const id of row) total += ext[id].maxY - ext[id].minY
  return total + gap * Math.max(0, row.length - 1)
}

/**
 * Lays both rows out centred on `centerY` and returns per-part offsets from
 * rest. Pure: the same extents always give the same drawing.
 */
export function layoutAssembly(
  ext: Record<AssemblyPart, PartExtent>,
  centerY: number,
  gap = ASSEMBLY_GAP,
): AssemblyLayout {
  const offsets = {} as Record<AssemblyPart, Vec3>
  const rows = {} as Record<AssemblyPart, 'shell' | 'mechanism' | 'clip'>
  const place = (row: readonly AssemblyPart[], x: number, kind: 'shell' | 'mechanism') => {
    const length = rowLength(row, ext, gap)
    let cursor = centerY - length / 2
    for (const id of row) {
      const len = ext[id].maxY - ext[id].minY
      const rest = (ext[id].minY + ext[id].maxY) / 2
      offsets[id] = { x, y: cursor + len / 2 - rest, z: 0 }
      rows[id] = kind
      cursor += len + gap
    }
    return length
  }
  const shell = place(SHELL_ROW, 0, 'shell')
  const mechanism = place(MECHANISM_ROW, ROW_OFFSET, 'mechanism')
  // The clip rides with the barrel axially and lifts clear above it.
  const barrel = offsets.barrel ?? zero()
  offsets.clip = { x: -CLIP_LIFT, y: barrel.y, z: 0 }
  rows.clip = 'clip'
  return {
    offsets,
    length: Math.max(shell, mechanism),
    span: CLIP_LIFT + ROW_OFFSET,
    centerY,
    rows,
  }
}

function smooth01(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

/** Order parts leave in: the shell first, tip to crown, then the mechanism. */
export const SPREAD_ORDER: readonly AssemblyPart[] = [
  'sleeve',
  'nose',
  'grip',
  'barrel',
  'clip',
  'cap',
  'lead',
  'clutch',
  'shaft',
  'spring',
]

/** Exploded-act windows in master progress. */
export const ASSEMBLY = {
  /** First part starts out. */
  outStart: 0.257,
  /** Per-part stagger on the way out. */
  outStagger: 0.0024,
  /** Travel time of one part. */
  outTravel: 0.017,
  /**
   * Every part is home by here, before the pencil turns toward the x-ray
   * view, so nothing is left floating while the camera moves.
   */
  homeBy: 0.474,
  /** Per-part stagger on the way home (reverse order). */
  homeStagger: 0.0011,
  /** Travel time home. */
  homeTravel: 0.009,
} as const

/**
 * 0..1 how far part `id` has travelled to its slot. Staggered out in
 * SPREAD_ORDER and home in reverse, so the drawing builds and folds up
 * like a sequence, not a pop. Pure: reverse scrub retraces it.
 */
export function spreadAt(p: number, id: AssemblyPart): number {
  const i = Math.max(0, SPREAD_ORDER.indexOf(id))
  const n = SPREAD_ORDER.length
  const out = smooth01((p - (ASSEMBLY.outStart + ASSEMBLY.outStagger * i)) / ASSEMBLY.outTravel)
  const homeEnd = ASSEMBLY.homeBy - ASSEMBLY.homeStagger * (n - 1 - i)
  const home = smooth01((homeEnd - p) / ASSEMBLY.homeTravel)
  return Math.min(out, home)
}

/**
 * 0..1 a sub-assembly coming apart inside its parent part (ring off the
 * grip, closing ring off the collet, knock and eraser out of the cap).
 * Opens once every part has room, and closes as its own parent travels
 * home, so the pieces converge together instead of on a separate clock.
 */
export function subAssemblyAt(p: number, parent: AssemblyPart): number {
  const open = smooth01((p - 0.288) / 0.011)
  const room = smooth01((spreadAt(p, parent) - 0.55) / 0.45)
  return Math.min(open, room)
}

/** Sub-assembly travel along the axis at full open, metres. */
export const SUB_TRAVEL = {
  ring: 0.0045,
  chuckRing: -0.0042,
  knock: 0.0055,
  eraser: -0.0085,
} as const

/** Feature beat for one part, written into `out`: zero allocation. */
export interface FeaturePose {
  /** 0..1 how far the part has lifted out of the drawing. */
  lift: number
  /** Turn about the part's own axis, radians. 0 and 2π meet exactly. */
  spin: number
}

/**
 * Feature beat from local progress 0..1 within the part's window: lift in
 * over the first fifth, one full turn about its own axis across the
 * middle, settle back over the last fifth. The turn starts and ends at a
 * whole revolution, so neighbouring windows meet without a jump.
 */
export function featurePose(lp: number, out: FeaturePose): FeaturePose {
  out.lift = smooth01(lp / 0.2) * (1 - smooth01((lp - 0.82) / 0.18))
  out.spin = Math.PI * 2 * smooth01((lp - 0.16) / 0.68)
  return out
}

/**
 * Presentation scale for a featured part: short parts grow more so a 4 mm
 * sleeve reads, long parts barely change so the drawing stays framed.
 */
export function featureScale(length: number): number {
  return Math.min(1.6, Math.max(1.05, 0.03 / Math.max(0.004, length)))
}

/** Extra axial room the sub-assemblies take when open, metres. */
export const SUB_MARGIN = 0.012

/**
 * Feature lift at full height, metres: toward the viewer (+Z) and away
 * from the other row (+X for the mechanism row, -X for the rest).
 */
export const FEATURE_LIFT = { toward: 0.011, away: 0.004 } as const

/**
 * Camera distance that frames the whole drawing. Wide screens lay it
 * horizontal and keep it in the upper part of the frame (copy and parts
 * list sit below); tall screens stand it upright above the copy sheet.
 * Sizes are in hero-scaled world metres.
 */
export function assemblyDistance(
  lengthM: number,
  spanM: number,
  vfovDeg: number,
  aspect: number,
  upright: boolean,
): number {
  const tanV = Math.tan((vfovDeg * Math.PI) / 360)
  const tanH = tanV * Math.max(0.3, aspect)
  // Horizontal: the long axis across the frame, the rows up the frame.
  // Upright: the long axis up the frame, the rows across it.
  const across = upright ? spanM : lengthM
  const along = upright ? lengthM : spanM
  // Wide: 78% of the width, leaving the act ruler its margin.
  const fitAcross = across / 2 / (tanH * (upright ? 0.78 : 0.78))
  const fitAlong = along / 2 / (tanV * (upright ? 0.6 : 0.42))
  return Math.max(fitAcross, fitAlong)
}

/** Screen share the drawing's centre sits above frame centre (tan units). */
export function assemblyLift(upright: boolean): number {
  return upright ? 0.24 : 0.28
}
