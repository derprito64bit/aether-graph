import { PENCIL } from '../../data/pencil.ts'
import {
  KNOCK_R,
  NOSE_TIP_R,
  PENCIL_BARREL_R,
  SLEEVE_R,
  ST,
} from '../PencilViewer/pencilDimensions.ts'

/**
 * The pencil's side elevation in drawing units (millimetres), tip at x = 0,
 * crown at x = 142, the axis on y = 0. Pure data and string builders, no
 * DOM: shared by the technical drawing and the loading page (which builds
 * its markup at build time in vite.config.ts).
 */

/** Metres to drawing units (millimetres), rounded to 0.1 mm. */
export const mm = (m: number): number => Math.round(m * 1e4) / 10

export const R = mm(PENCIL_BARREL_R)
export const TIP = mm(ST.leadPoint)
export const SLEEVE_MOUTH = mm(ST.sleeveMouth)
export const SLEEVE_BASE = mm(ST.sleeveBase)
export const NOSE_BASE = mm(ST.noseBase)
export const GRIP_TOP = mm(ST.gripTop)
export const RING_TOP = mm(ST.ringTop)
export const BARREL_TOP = mm(ST.barrelTop)
export const CAP_TOP = mm(ST.capTop)
export const KNOCK_TOP = mm(ST.knockTop)
export const CROWN = PENCIL.lengthMm
export const KNOCK = mm(KNOCK_R)

/**
 * Side-elevation profile, tip to crown, as (x, radius) stations. Steps
 * repeat x so shoulders stay square, the way a machinist draws them.
 */
export const PROFILE: ReadonlyArray<readonly [number, number]> = [
  [SLEEVE_MOUTH, mm(SLEEVE_R)],
  [SLEEVE_BASE, mm(SLEEVE_R)],
  [SLEEVE_BASE, mm(NOSE_TIP_R)],
  [NOSE_BASE, R - 0.3],
  [NOSE_BASE, R],
  [GRIP_TOP, R],
  [GRIP_TOP, R + 0.12],
  [RING_TOP, R + 0.12],
  [RING_TOP, R],
  [BARREL_TOP, R],
  [BARREL_TOP, R - 0.2],
  [CAP_TOP, R - 0.2],
  [CAP_TOP, KNOCK],
  [KNOCK_TOP, KNOCK],
]

/** Closed silhouette path: the profile, a domed knock crown, back along the bottom. */
export function outlinePath(): string {
  const top = PROFILE.map(([x, r]) => `${x},${-r}`)
  const bottom = [...PROFILE].reverse().map(([x, r]) => `${x},${r}`)
  // Crown dome closes the knock between the last top and first bottom point.
  return `M${top.join(' L')} A${CROWN - KNOCK_TOP} ${KNOCK} 0 0 1 ${KNOCK_TOP},${KNOCK} L${bottom.join(' L')} Z`
}

/** Shoulder lines where parts meet, as (x, half-height). */
export const JOINTS: ReadonlyArray<readonly [number, number]> = [
  [SLEEVE_BASE, mm(NOSE_TIP_R)],
  [NOSE_BASE, R],
  [GRIP_TOP, R + 0.12],
  [RING_TOP, R + 0.12],
  [BARREL_TOP, R],
  [CAP_TOP, R - 0.2],
]

/** Pocket clip outline above the barrel. */
export function clipPath(): string {
  return `M63.2,${-R} Q63.2,${-R - 2} 65.2,${-R - 2} L${BARREL_TOP - 3},${-R - 2} L${BARREL_TOP},${-R} L${BARREL_TOP - 2.2},${-R} L${BARREL_TOP - 4},${-R - 1.1} L65.6,${-R - 1.1} Q64.4,${-R - 1.1} 64.4,${-R} Z`
}
