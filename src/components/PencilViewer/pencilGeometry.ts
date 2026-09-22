import * as THREE from 'three'
import {
  ERASER_R,
  KNOCK_R,
  LEAD_R,
  PENCIL_BARREL_R,
  SHAFT_R,
  SLEEVE_R,
  SPRING_COIL_R,
  SPRING_WIRE_R,
  ST,
} from './pencilDimensions.ts'

/**
 * Procedural pencil geometry. Lathe profiles carry a chamfer on every
 * visible edge so highlights have something to catch; nothing here is a
 * bare primitive. Detail tiers halve the radial segments on coarse
 * pointers. All units are meters.
 */

export type PencilDetail = 'high' | 'low'

function segments(detail: PencilDetail, high: number): number {
  return detail === 'high' ? high : Math.max(12, Math.floor(high / 2))
}

type Profile = Array<[r: number, y: number]>

function lathe(profile: Profile, detail: PencilDetail, high = 48): THREE.LatheGeometry {
  const points = profile.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y))
  const geometry = new THREE.LatheGeometry(points, segments(detail, high))
  geometry.computeVertexNormals()
  return geometry
}

const C = 0.0002 // standard edge chamfer

/** Barrel tube with chamfered ends and two engraved index grooves. */
export function barrelGeometry(detail: PencilDetail): THREE.LatheGeometry {
  const r = PENCIL_BARREL_R
  const y0 = ST.barrelTop - 0.082
  const y1 = ST.barrelTop
  const g1 = y1 - 0.012
  const g2 = y1 - 0.014
  return lathe(
    [
      [r - C, y0],
      [r, y0 + C],
      [r, g1 - 0.0004],
      [r - 0.00012, g1],
      [r - 0.00012, g2],
      [r, g2 + 0.0004],
      [r, y1 - C],
      [r - C, y1],
    ],
    detail,
  )
}

/** Nose cone: long tapered cone with a tip chamfer and base fillet. */
export function noseGeometry(detail: PencilDetail): THREE.LatheGeometry {
  const y0 = ST.sleeveBase
  const y1 = ST.noseBase
  return lathe(
    [
      [0.0011, y0],
      [0.0013, y0 + C],
      [0.0028, y0 + 0.006],
      [PENCIL_BARREL_R - 0.0004, y1 - 0.0012],
      [PENCIL_BARREL_R, y1 - C],
      [PENCIL_BARREL_R, y1],
    ],
    detail,
  )
}

/** Grip: shallow hourglass with two groove dips; knurl comes from the bump map. */
export function gripGeometry(detail: PencilDetail): THREE.LatheGeometry {
  const y0 = ST.gripBase
  const y1 = ST.gripTop
  const mid = (y0 + y1) / 2
  return lathe(
    [
      [PENCIL_BARREL_R - 0.0002, y0],
      [PENCIL_BARREL_R, y0 + C],
      [0.00432, mid - 0.004],
      [0.00428, mid],
      [0.00432, mid + 0.004],
      [PENCIL_BARREL_R, y1 - C],
      [PENCIL_BARREL_R - 0.0002, y1],
    ],
    detail,
  )
}

/** Fixed lead sleeve: polished tube with a mouth chamfer. */
export function sleeveGeometry(detail: PencilDetail): THREE.LatheGeometry {
  return lathe(
    [
      [SLEEVE_R - C, ST.sleeveMouth],
      [SLEEVE_R, ST.sleeveMouth + C],
      [SLEEVE_R, ST.sleeveBase - C],
      [SLEEVE_R - C, ST.sleeveBase],
    ],
    detail,
    32,
  )
}

/** Top cap with a crown chamfer. */
export function capGeometry(detail: PencilDetail): THREE.LatheGeometry {
  const y0 = ST.barrelTop - 0.001
  const y1 = ST.capTop
  return lathe(
    [
      [PENCIL_BARREL_R - 0.0001, y0],
      [PENCIL_BARREL_R, y0 + C],
      [0.0042, y1 - 0.0008],
      [0.004, y1 - C],
      [0.0036, y1],
    ],
    detail,
  )
}

/** Knock button riding through the cap crown. */
export function knockGeometry(detail: PencilDetail): THREE.LatheGeometry {
  const y0 = ST.capTop - 0.001
  const y1 = ST.knockTop
  return lathe(
    [
      [KNOCK_R - C, y0],
      [KNOCK_R, y0 + C],
      [KNOCK_R, y1 - C],
      [KNOCK_R - C, y1],
    ],
    detail,
    32,
  )
}

/** Polished divider ring between grip and barrel. */
export function ringGeometry(detail: PencilDetail): THREE.LatheGeometry {
  return lathe(
    [
      [PENCIL_BARREL_R + 0.0001, ST.gripTop],
      [PENCIL_BARREL_R + 0.0001, ST.ringTop],
    ],
    detail,
    48,
  )
}

/** Reservoir shaft: inner aluminium tube. */
export function shaftGeometry(detail: PencilDetail): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(
    SHAFT_R,
    SHAFT_R,
    ST.shaftTop - ST.shaftBase,
    segments(detail, 32),
    1,
    false,
  )
}

/** Graphite lead core. */
export function leadGeometry(detail: PencilDetail): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(LEAD_R, LEAD_R, 0.055, segments(detail, 16), 1, false)
}

/** Sharpened lead point. */
export function leadPointGeometry(detail: PencilDetail): THREE.ConeGeometry {
  return new THREE.ConeGeometry(LEAD_R, 0.0008, segments(detail, 16))
}

/** Compression spring as a wound tube: six turns, closed ends. */
export function springGeometry(detail: PencilDetail): THREE.TubeGeometry {
  const turns = 6
  const length = ST.springTop - ST.springBase
  const points: THREE.Vector3[] = []
  const steps = detail === 'high' ? 220 : 110
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = t * turns * Math.PI * 2
    points.push(
      new THREE.Vector3(
        Math.cos(a) * SPRING_COIL_R,
        ST.springBase + t * length,
        Math.sin(a) * SPRING_COIL_R,
      ),
    )
  }
  const curve = new THREE.CatmullRomCurve3(points)
  return new THREE.TubeGeometry(curve, steps, SPRING_WIRE_R, detail === 'high' ? 10 : 6, false)
}

/** One clutch jaw: a tapered three-sided prism, gripping tip at local y = 0. */
export function jawGeometry(detail: PencilDetail): THREE.ConeGeometry {
  void detail
  const jaw = new THREE.ConeGeometry(0.0011, 0.011, 3)
  jaw.rotateX(Math.PI)
  jaw.translate(0, 0.0055, 0)
  return jaw
}

/** Chuck ring seating the jaws. */
export function chuckRingGeometry(detail: PencilDetail): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(0.0036, 0.0039, 0.004, segments(detail, 32), 1, false)
}

/** Pocket clip: tapered spring-steel blade with a mounting foot. */
export function clipGeometry(): THREE.ExtrudeGeometry {
  const length = ST.clipTop - ST.clipBase
  const shape = new THREE.Shape()
  shape.moveTo(-0.0016, 0)
  shape.lineTo(0.0016, 0)
  shape.lineTo(0.0011, length)
  shape.quadraticCurveTo(0.001, length + 0.0012, 0, length + 0.0012)
  shape.quadraticCurveTo(-0.001, length + 0.0012, -0.0011, length)
  shape.lineTo(-0.0016, 0)
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.0005, bevelEnabled: false })
  geometry.translate(0, 0, -0.00025)
  return geometry
}

/** Eraser plug with a softly domed crown. */
export function eraserGeometry(detail: PencilDetail): THREE.LatheGeometry {
  return lathe(
    [
      [0.0001, ST.eraserBase],
      [ERASER_R, ST.eraserBase + C],
      [ERASER_R, ST.eraserTop - C],
      [ERASER_R - 0.0003, ST.eraserTop],
      [0.0001, ST.eraserTop + 0.0002],
    ],
    detail,
    32,
  )
}
