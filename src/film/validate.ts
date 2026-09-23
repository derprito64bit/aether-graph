import { PENCIL_BARREL_R, PENCIL_LENGTH } from '../components/PencilViewer/pencilDimensions.ts'
import type { FilmKey } from './key.ts'
import { ACTS } from './timeline.ts'

export interface TimelineIssue {
  rule: string
  detail: string
}

const FIT_MIN = 0
const FIT_MAX = 1.4
const FOV_MIN = 10
const FOV_MAX = 52
const FOV_MAX_LIMIT = 60
const MAX_GAP = 0.06
const BOUNDARY_WINDOW = 0.03
const SLAB_MARGIN_M = 0.01

function isFiniteKey(k: FilmKey): boolean {
  const values = [
    k.at,
    k.pose.rx,
    k.pose.ry,
    k.pose.rz,
    k.pose.scale,
    k.pose.px,
    k.pose.py,
    ...k.camera.pos,
    ...k.camera.target,
    k.lens.fov,
    k.lens.fit ?? 0.5,
    k.lens.fovMax ?? 52,
    k.look.exposure,
    k.look.glass,
  ]
  return values.every((v) => Number.isFinite(v))
}

/** Pencil-local cylinder test: is the camera outside the barrel plus margin? */
function cameraOutsideShell(k: FilmKey): boolean {
  const { rx, ry, rz, scale, px, py } = k.pose
  const [cx, cy, cz] = k.camera.pos
  // World offset from pencil center, then inverse-rotate into pencil frame.
  const dx = cx - px
  const dy = cy - py
  const dz = cz
  const cosRx = Math.cos(-rx)
  const sinRx = Math.sin(-rx)
  const cosRy = Math.cos(-ry)
  const sinRy = Math.sin(-ry)
  const cosRz = Math.cos(-rz)
  const sinRz = Math.sin(-rz)
  // Inverse XYZ euler: Rz(-rz) * Ry(-ry) * Rx(-rx) applied to the offset.
  const x1 = dx
  const y1 = cosRx * dy - sinRx * dz
  const z1 = sinRx * dy + cosRx * dz
  const x2 = cosRy * x1 + sinRy * z1
  const y2 = y1
  const z2 = -sinRy * x1 + cosRy * z1
  const lx = cosRz * x2 - sinRz * y2
  const ly = sinRz * x2 + cosRz * y2
  const lz = z2
  const hr = PENCIL_BARREL_R * scale + SLAB_MARGIN_M
  const hy = (PENCIL_LENGTH / 2) * scale + SLAB_MARGIN_M
  return (lx / hr) ** 2 + (lz / hr) ** 2 > 1 || Math.abs(ly) > hy
}

/**
 * Validates the authored timeline. Runs in dev on import and in unit tests.
 * Returns every violation; empty means shippable.
 */
export function validateTimeline(keys: FilmKey[]): TimelineIssue[] {
  const issues: TimelineIssue[] = []
  if (keys.length === 0) return [{ rule: 'non-empty', detail: 'timeline has no keys' }]

  const first = keys[0]
  const last = keys[keys.length - 1]
  if (first === undefined || last === undefined) return issues
  if (first.at !== 0) issues.push({ rule: 'starts-at-0', detail: `first key at ${first.at}` })
  if (last.at !== 1) issues.push({ rule: 'ends-at-1', detail: `last key at ${last.at}` })

  keys.forEach((k, i) => {
    if (!isFiniteKey(k))
      issues.push({ rule: 'no-nan', detail: `key ${i} at ${k.at} is not finite` })
    if (i > 0) {
      const prev = keys[i - 1]
      if (prev !== undefined && k.at <= prev.at) {
        issues.push({
          rule: 'strictly-increasing',
          detail: `key ${i} at ${k.at} follows ${prev.at}`,
        })
      }
      // MAX_GAP is inclusive: the exploded 0.30 -> 0.36 pair sits exactly
      // on it by design. The epsilon keeps binary float dust (e.g. an
      // authored 0.06 arriving as 0.0600000001) from tripping the rule.
      if (prev !== undefined && k.at - prev.at > MAX_GAP + 1e-9) {
        issues.push({ rule: 'max-gap', detail: `gap ${prev.at} to ${k.at} exceeds ${MAX_GAP}` })
      }
    }
    if (k.lens.fit !== undefined && !(k.lens.fit > FIT_MIN && k.lens.fit <= FIT_MAX)) {
      issues.push({
        rule: 'fit-range',
        detail: `key at ${k.at} fit ${k.lens.fit} outside (0, 1.4]`,
      })
    }
    if (!(k.lens.fov >= FOV_MIN && k.lens.fov <= FOV_MAX)) {
      issues.push({
        rule: 'fov-range',
        detail: `key at ${k.at} fov ${k.lens.fov} outside [10, 52]`,
      })
    }
    if (k.lens.fovMax !== undefined && !(k.lens.fovMax > 0 && k.lens.fovMax <= FOV_MAX_LIMIT)) {
      issues.push({ rule: 'fovmax-range', detail: `key at ${k.at} fovMax ${k.lens.fovMax}` })
    }
    if (!cameraOutsideShell(k)) {
      issues.push({
        rule: 'camera-outside-shell',
        detail: `key at ${k.at} places the camera inside the shell slab`,
      })
    }
  })

  for (let i = 0; i < ACTS.length - 1; i++) {
    const boundary = ACTS[i]?.end
    if (boundary === undefined) continue
    const before = keys.some((k) => k.at <= boundary && boundary - k.at <= BOUNDARY_WINDOW)
    const after = keys.some((k) => k.at >= boundary && k.at - boundary <= BOUNDARY_WINDOW)
    if (!before || !after) {
      issues.push({
        rule: 'boundary-covered',
        detail: `act boundary ${boundary} missing a key within ${BOUNDARY_WINDOW}`,
      })
    }
  }
  return issues
}
