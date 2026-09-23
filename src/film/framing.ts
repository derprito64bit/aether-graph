import { silhouetteHeightM, silhouetteWidthM } from '../components/PencilViewer/pencilDimensions.ts'
import { TEARDOWN_LAYERS, cursorAt } from './teardown/layers.ts'

export interface FitOptions {
  /** Target share of viewport height the phone should fill. */
  fit: number
  /** Camera distance eye to target in meters. */
  distanceM: number
  /** Viewport aspect width over height. */
  aspect: number
  /** Phone pose and scale at this sample. */
  scale: number
  rxRad: number
  ryRad: number
  /** Off-center world offset in meters folded into the width guard. */
  pxM?: number
  horizontalMargin?: number
  minFovDeg?: number
  maxFovDeg?: number
}

/**
 * Monotone aspect-tier policy: the authored fit warms per format with no
 * boundary jumps. 16:9 is the authored baseline.
 */
export function formatFit(aspect: number, fit: number): number {
  const tiers: ReadonlyArray<{ aspect: number; tier: number }> = [
    { aspect: 3.5, tier: 1.16 },
    { aspect: 2.4, tier: 1.12 },
    { aspect: 1.78, tier: 1.0 },
    { aspect: 1.2, tier: 0.95 },
    { aspect: 0.75, tier: 0.9 },
  ]
  for (let i = 0; i < tiers.length; i++) {
    const lower = tiers[i]
    if (lower === undefined) continue
    if (aspect >= lower.aspect) {
      if (i === 0) return fit * lower.tier
      const upper = tiers[i - 1]
      if (upper === undefined) return fit * lower.tier
      const t = Math.min(1, Math.max(0, (aspect - lower.aspect) / (upper.aspect - lower.aspect)))
      return fit * (lower.tier + (upper.tier - lower.tier) * t)
    }
  }
  return fit * 0.82
}

/**
 * Vertical FOV in degrees framing the phone to fit of the viewport while
 * keeping the horizontal span inside the margin. Tighter axis wins.
 */
export function fitFov(options: FitOptions): number {
  const { fit, distanceM, aspect, scale, rxRad, ryRad, minFovDeg = 10, maxFovDeg = 52 } = options
  const horizontalMargin =
    options.horizontalMargin ??
    Math.min(0.86, Math.max(0.78, 0.86 - Math.max(0, aspect - 1.9) * 0.05))
  const eh = silhouetteHeightM(scale, rxRad)
  const ew = silhouetteWidthM(scale, ryRad)
  const offsetSpan = Math.abs(options.pxM ?? 0)
  const tanV = eh / (2 * distanceM * Math.max(formatFit(aspect, fit), 0.05))
  const tanH = (ew * 0.5 + offsetSpan) / (distanceM * Math.max(aspect, 0.3) * horizontalMargin)
  const fov = (2 * Math.atan(Math.max(tanV, tanH)) * 180) / Math.PI
  return Math.min(maxFovDeg, Math.max(minFovDeg, fov))
}

/**
 * Screen-space bias for off-center compositions. Clamps hard on narrow
 * screens, gently emphasizes on ultrawide room.
 */
export function centerBias(aspect: number, axis: 'x' | 'y'): number {
  const limit = axis === 'x' ? 1.5 : 1.1
  const base = Math.min(1, Math.max(0.25, aspect / limit))
  if (axis === 'x' && aspect > 1.9) {
    const t = Math.min(1, (aspect - 1.9) / (3.5 - 1.9))
    return base + (1.25 - base) * t
  }
  return base
}

const MACRO_REGIONS: ReadonlyArray<{ start: number; end: number; halfM: number }> = [
  { start: 0.63, end: 0.72, halfM: 0.011 },
  { start: 0.17, end: 0.23, halfM: 0.03 },
]

/** Teardown feature run guarded per featured layer. */
const TEARDOWN_MACRO = { start: 0.32, end: 0.44 }

/**
 * Minimum vertical FOV keeping a macro subject framed on narrow viewports.
 * Over the teardown run the floor follows the currently featured layer's
 * own half-height from the manifest (barrel 0.071 sets the widest in this
 * span, clutch 0.006 the tightest) instead of one fixed floor for layers
 * with very different footprints.
 */
export function macroFloorFov(p: number, distanceM: number, aspect: number): number {
  let halfM = 0
  if (p >= TEARDOWN_MACRO.start && p <= TEARDOWN_MACRO.end) {
    const featured = Math.min(9, Math.max(0, Math.floor(cursorAt(p))))
    halfM = TEARDOWN_LAYERS[featured]?.featureHalfM ?? 0
  } else {
    for (const region of MACRO_REGIONS) {
      if (p >= region.start && p <= region.end) halfM = region.halfM
    }
  }
  if (halfM <= 0) return 0
  const denom = distanceM * Math.max(aspect, 0.35) * 0.8
  if (denom <= 0) return 0
  return Math.min(85, (2 * Math.atan(halfM / denom) * 180) / Math.PI)
}
