import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
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
 * Procedural pencil geometry, built the way the parts are made: turned
 * profiles with every corner filleted so highlights roll instead of
 * faceting, grooves where a machinist would cut them, a swept spring-steel
 * clip, and a split three-jaw collet. Detail tiers halve the radial
 * segments on coarse pointers. All units are metres.
 */

export type PencilDetail = 'high' | 'low'

function segments(detail: PencilDetail, high: number): number {
  return detail === 'high' ? high : Math.max(16, Math.floor(high / 2))
}

type Profile = Array<[r: number, y: number]>

/** Default edge break: a 0.15 mm fillet on every corner. */
const EDGE = 0.00015

/**
 * Rounds every interior corner of a profile with a quadratic fillet. The
 * radius clamps to half of either neighbouring segment, so tiny steps keep
 * their shape instead of folding over.
 */
function fillet(profile: Profile, radius = EDGE, steps = 4): Profile {
  if (profile.length < 3) return profile
  const out: Profile = [profile[0] as [number, number]]
  for (let i = 1; i < profile.length - 1; i++) {
    const [ar, ay] = profile[i - 1] as [number, number]
    const [pr, py] = profile[i] as [number, number]
    const [cr, cy] = profile[i + 1] as [number, number]
    const la = Math.hypot(ar - pr, ay - py)
    const lc = Math.hypot(cr - pr, cy - py)
    const d = Math.min(radius, la / 2, lc / 2)
    if (d < 1e-7) {
      out.push([pr, py])
      continue
    }
    const p1: [number, number] = [pr + ((ar - pr) / la) * d, py + ((ay - py) / la) * d]
    const p2: [number, number] = [pr + ((cr - pr) / lc) * d, py + ((cy - py) / lc) * d]
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const u = 1 - t
      out.push([
        u * u * p1[0] + 2 * u * t * pr + t * t * p2[0],
        u * u * p1[1] + 2 * u * t * py + t * t * p2[1],
      ])
    }
  }
  out.push(profile[profile.length - 1] as [number, number])
  return out
}

function lathe(
  profile: Profile,
  detail: PencilDetail,
  high = 72,
  phiStart = 0,
  phiLength = Math.PI * 2,
): THREE.LatheGeometry {
  const points = profile.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y))
  const geometry = new THREE.LatheGeometry(points, segments(detail, high), phiStart, phiLength)
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Re-maps a lathe's UVs so V (or U when `alongU`) runs linearly with height
 * between y0 and y1 instead of by profile index, which bunches texels at
 * every fillet. The around coordinate keeps the lathe's segment index, so
 * the seam stays clean.
 */
function axialUV(geometry: THREE.BufferGeometry, y0: number, y1: number, alongU = false): void {
  const pos = geometry.getAttribute('position')
  const uv = geometry.getAttribute('uv')
  for (let i = 0; i < pos.count; i++) {
    const along = (pos.getY(i) - y0) / (y1 - y0)
    const around = uv.getX(i)
    if (alongU) uv.setXY(i, along, around)
    else uv.setXY(i, around, along)
  }
  uv.needsUpdate = true
}

const R = PENCIL_BARREL_R

/** Barrel tube: ground ends, two index grooves at each end, axial UVs for the etch. */
export function barrelGeometry(detail: PencilDetail): THREE.LatheGeometry {
  const y0 = ST.ringTop
  const y1 = ST.barrelTop
  const groove = (y: number): Profile => [
    [R, y - 0.00022],
    [R - 0.00011, y - 0.00008],
    [R - 0.00011, y + 0.00008],
    [R, y + 0.00022],
  ]
  const geometry = lathe(
    fillet([
      [R - 0.00035, y0],
      [R, y0 + 0.00025],
      ...groove(y0 + 0.0024),
      ...groove(y0 + 0.0031),
      ...groove(y1 - 0.0135),
      ...groove(y1 - 0.0128),
      [R, y1 - 0.00025],
      [R - 0.00035, y1],
    ]),
    detail,
    96,
  )
  axialUV(geometry, y0, y1, true)
  return geometry
}

/**
 * Nose cone: a tip collar that seats the sleeve, a long ogive taper so the
 * hand never hides the point, then a seating groove and a land into the grip.
 */
export function noseGeometry(detail: PencilDetail): THREE.LatheGeometry {
  const y0 = ST.sleeveBase
  const y1 = ST.noseBase
  const tipR = 0.00125
  const taperStart = y0 + 0.0011
  const taperEnd = y1 - 0.0021
  const ogive: Profile = []
  const steps = detail === 'high' ? 18 : 9
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // Convex ogive: radius grows fast off the tip, flattens into the body.
    const shaped = 1 - Math.pow(1 - t, 1.55)
    ogive.push([tipR + (R - 0.0003 - tipR) * shaped, taperStart + (taperEnd - taperStart) * t])
  }
  return lathe(
    fillet(
      [
        [0.00095, y0],
        [0.0014, y0 + 0.00012],
        [0.0014, y0 + 0.0008],
        [tipR, y0 + 0.00095],
        ...ogive,
        [R - 0.0003, y1 - 0.0016],
        [R - 0.00042, y1 - 0.00135],
        [R - 0.00042, y1 - 0.00105],
        [R - 0.0002, y1 - 0.0008],
        [R, y1 - 0.0004],
        [R, y1],
      ],
      0.0001,
    ),
    detail,
    72,
  )
}

/**
 * Grip: a straight knurled band between two plain lands, each land split
 * from the knurl by a shallow V groove. The knurl itself is the normal map
 * (createKnurlNormalMaps), mapped with V running along the grip.
 */
export function gripGeometry(detail: PencilDetail): THREE.LatheGeometry {
  const y0 = ST.gripBase
  const y1 = ST.gripTop
  const len = y1 - y0
  const landEnd = y0 + len * 0.07
  const landStart = y1 - len * 0.07
  const v = (y: number): Profile => [
    [R, y - 0.0002],
    [R - 0.00016, y],
    [R, y + 0.0002],
  ]
  const geometry = lathe(
    fillet(
      [
        [R - 0.00025, y0],
        [R, y0 + 0.0002],
        ...v(landEnd),
        [R - 0.00004, (y0 + y1) / 2],
        ...v(landStart),
        [R, y1 - 0.0002],
        [R - 0.00025, y1],
      ],
      0.00008,
    ),
    detail,
    96,
  )
  axialUV(geometry, y0, y1)
  return geometry
}

/** Fixed lead sleeve: polished tube, mouth radiused, seated in the collar. */
export function sleeveGeometry(detail: PencilDetail): THREE.LatheGeometry {
  return lathe(
    fillet(
      [
        [LEAD_R + 0.00006, ST.sleeveMouth],
        [SLEEVE_R - 0.00016, ST.sleeveMouth],
        [SLEEVE_R, ST.sleeveMouth + 0.00018],
        [SLEEVE_R, ST.sleeveBase - 0.0002],
        [SLEEVE_R + 0.0002, ST.sleeveBase],
      ],
      0.00008,
    ),
    detail,
    40,
  )
}

/**
 * Cap: a proud collar the clip roots into, the cap body with two fine
 * grooves, and a radiused crown around the knock bore.
 */
export function capGeometry(detail: PencilDetail): THREE.LatheGeometry {
  const y0 = ST.barrelTop - 0.001
  const y1 = ST.capTop
  return lathe(
    fillet([
      [R - 0.0001, y0],
      [R + 0.00012, y0 + 0.0003],
      [R + 0.00012, y0 + 0.0029],
      [R - 0.00015, y0 + 0.0033],
      [R - 0.00015, y0 + 0.0046],
      [R - 0.00026, y0 + 0.0049],
      [R - 0.00015, y0 + 0.0052],
      [R - 0.00015, y0 + 0.0058],
      [R - 0.00026, y0 + 0.0061],
      [R - 0.00015, y0 + 0.0064],
      [R - 0.00015, y1 - 0.0009],
      [R - 0.0009, y1],
      [KNOCK_R + 0.00012, y1],
    ]),
    detail,
    80,
  )
}

/** Knock button: a groove under a domed, radiused crown. */
export function knockGeometry(detail: PencilDetail): THREE.LatheGeometry {
  const y0 = ST.capTop - 0.001
  const y1 = ST.knockTop
  const dome: Profile = []
  for (let i = 1; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2)
    dome.push([(KNOCK_R - 0.0004) * Math.cos(a), y1 + 0.0004 * Math.sin(a)])
  }
  return lathe(
    fillet(
      [
        [KNOCK_R, y0],
        [KNOCK_R, y1 - 0.0012],
        [KNOCK_R - 0.00012, y1 - 0.001],
        [KNOCK_R - 0.00012, y1 - 0.0008],
        [KNOCK_R, y1 - 0.0006],
        [KNOCK_R, y1 - 0.00012],
        [KNOCK_R - 0.0004, y1],
        ...dome,
      ],
      0.00008,
    ),
    detail,
    48,
  )
}

/** Polished divider ring: stands proud of the barrel, V groove at its waist. */
export function ringGeometry(detail: PencilDetail): THREE.LatheGeometry {
  const y0 = ST.gripTop
  const y1 = ST.ringTop
  const mid = (y0 + y1) / 2
  return lathe(
    fillet(
      [
        [R - 0.0001, y0],
        [R + 0.00014, y0 + 0.00024],
        [R + 0.00014, mid - 0.00022],
        [R + 0.00002, mid],
        [R + 0.00014, mid + 0.00022],
        [R + 0.00014, y1 - 0.00024],
        [R - 0.0001, y1],
      ],
      0.00006,
    ),
    detail,
    96,
  )
}

/** Reservoir shaft: stepped connector into the clutch, then the long tube. */
export function shaftGeometry(detail: PencilDetail): THREE.LatheGeometry {
  return lathe(
    fillet([
      [0.0006, 0.0186],
      [0.0012, 0.0186],
      [0.0012, 0.0236],
      [0.0019, 0.0241],
      [0.0019, 0.0268],
      [SHAFT_R - 0.0002, 0.0274],
      [SHAFT_R, 0.028],
      [SHAFT_R, ST.shaftTop - 0.0005],
      [SHAFT_R - 0.0004, ST.shaftTop],
      [0.0014, ST.shaftTop],
    ]),
    detail,
    48,
  )
}

/** Graphite lead core. */
export function leadGeometry(detail: PencilDetail): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(LEAD_R, LEAD_R, 0.055, segments(detail, 20), 1, false)
}

/** Sharpened lead point. */
export function leadPointGeometry(detail: PencilDetail): THREE.ConeGeometry {
  return new THREE.ConeGeometry(LEAD_R, 0.0008, segments(detail, 20))
}

/**
 * Compression spring: a wound tube whose end turns close up to solid
 * height and sit flat, the way a ground spring is made.
 */
export function springGeometry(detail: PencilDetail): THREE.TubeGeometry {
  const length = ST.springTop - ST.springBase
  const endTurns = 0.9
  const bodyTurns = 5.2
  const closedPitch = SPRING_WIRE_R * 2.05
  const bodyPitch = (length - 2 * endTurns * closedPitch) / bodyTurns
  const total = endTurns * 2 + bodyTurns
  const points: THREE.Vector3[] = []
  const steps = detail === 'high' ? 320 : 160
  for (let i = 0; i <= steps; i++) {
    const turn = (i / steps) * total
    const a = turn * Math.PI * 2
    let y: number
    if (turn < endTurns) y = turn * closedPitch
    else if (turn < endTurns + bodyTurns) y = endTurns * closedPitch + (turn - endTurns) * bodyPitch
    else
      y =
        endTurns * closedPitch + bodyTurns * bodyPitch + (turn - endTurns - bodyTurns) * closedPitch
    points.push(
      new THREE.Vector3(
        Math.cos(a) * SPRING_COIL_R,
        ST.springBase + SPRING_WIRE_R + y,
        Math.sin(a) * SPRING_COIL_R,
      ),
    )
  }
  const curve = new THREE.CatmullRomCurve3(points)
  return new THREE.TubeGeometry(curve, steps, SPRING_WIRE_R, detail === 'high' ? 12 : 6, false)
}

/** Angular width of one collet jaw; the remainder of each third is the slit. */
export const JAW_SPAN = (Math.PI * 2) / 3 - 0.16

/**
 * Flat face closing a partial lathe at angle `phi`. `side` is -1 for the
 * start face and +1 for the end face; the winding is checked against the
 * outward direction so the face can never render inside-out.
 */
function latheCap(profile: Profile, phi: number, side: -1 | 1): THREE.BufferGeometry {
  const first = profile[0]
  const last = profile[profile.length - 1]
  const closed =
    first !== undefined && last !== undefined && first[0] === last[0] && first[1] === last[1]
  const loop = closed ? profile.slice(0, -1) : profile
  const contour = loop.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y))
  const triangles = THREE.ShapeUtils.triangulateShape(contour, [])
  const sin = Math.sin(phi)
  const cos = Math.cos(phi)
  const positions: number[] = []
  for (const v of contour) positions.push(sin * v.x, v.y, cos * v.x)
  // Direction of increasing phi on the lathe is (cos, 0, -sin).
  const outward = new THREE.Vector3(cos * side, 0, -sin * side)
  const index: number[] = []
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  let flip = false
  const [i0 = 0, j0 = 0, k0 = 0] = triangles[0] ?? []
  if (triangles.length > 0) {
    a.fromArray(positions, i0 * 3)
    b.fromArray(positions, j0 * 3)
    c.fromArray(positions, k0 * 3)
    const n = b.clone().sub(a).cross(c.clone().sub(a))
    flip = n.dot(outward) < 0
  }
  for (const [i = 0, j = 0, k = 0] of triangles) {
    if (flip) index.push(i, k, j)
    else index.push(i, j, k)
  }
  const normals: number[] = []
  const uvs: number[] = []
  for (let i = 0; i < contour.length; i++) {
    normals.push(outward.x, outward.y, outward.z)
    uvs.push(0, 0)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(index)
  return geometry
}

/**
 * One collet jaw: a third of a split brass tube, its gripping end flared
 * into the cone the closing ring bears on, bored to the lead. Built around
 * the pencil axis and centred on local +X, gripping tip at local y = 0. The
 * two slit faces are capped, so the jaw reads as solid brass through the
 * slits in the clutch close-up.
 */
export function jawGeometry(detail: PencilDetail): THREE.BufferGeometry {
  const bore = LEAD_R + 0.00003
  // Closed loop: outer surface bottom to top (outward normals), then the
  // bore back down, so the jaw is a solid with its bore showing.
  const profile = fillet(
    [
      [bore, 0],
      [0.00062, 0],
      [0.00078, 0.00035],
      [0.00142, 0.0026],
      [0.00142, 0.0031],
      [0.00098, 0.0046],
      [0.00105, 0.0052],
      [0.00105, 0.011],
      [bore, 0.011],
      [bore, 0],
    ],
    0.00006,
  )
  const phiStart = Math.PI / 2 - JAW_SPAN / 2
  const body = lathe(profile, detail, 24, phiStart, JAW_SPAN)
  const start = latheCap(profile, phiStart, -1)
  const end = latheCap(profile, phiStart + JAW_SPAN, 1)
  const merged = mergeGeometries([body, start, end])
  body.dispose()
  start.dispose()
  end.dispose()
  if (merged === null) throw new Error('jaw geometry merge failed')
  return merged
}

/** Closing ring: a bored brass sleeve with chamfered faces and a knurled-look band. */
export function chuckRingGeometry(detail: PencilDetail): THREE.LatheGeometry {
  const y0 = -0.0018
  const y1 = 0.0018
  return lathe(
    fillet(
      [
        [0.00132, y0],
        [0.0022, y0],
        [0.00255, y0 + 0.00035],
        [0.00255, -0.0005],
        [0.00238, -0.0003],
        [0.00238, 0.0003],
        [0.00255, 0.0005],
        [0.00255, y1 - 0.00035],
        [0.0022, y1],
        [0.00132, y1],
        [0.00132, y0],
      ],
      0.00006,
    ),
    detail,
    56,
  )
}

/**
 * Pocket clip as a swept spring-steel blade: crowned section, tapering from
 * root to tip, standing proud of the barrel through its middle, rooting down
 * into the cap collar, with a rounded nose. Built in assembly space on the
 * +Z side of the barrel.
 */
export function clipGeometry(detail: PencilDetail = 'high'): THREE.BufferGeometry {
  const y0 = ST.clipBase
  const y1 = ST.barrelTop + 0.0012
  const n = detail === 'high' ? 72 : 36
  const thickness = 0.00045
  const bevel = 0.00012
  // Section outline (lateral x, outward z), counter-clockwise from outside.
  const section = (w: number): Array<[number, number]> => [
    [-w / 2 + bevel, 0],
    [w / 2 - bevel, 0],
    [w / 2, bevel],
    [w / 2, thickness - bevel],
    [w / 2 - bevel * 1.4, thickness + 0.00004],
    [0, thickness + 0.00008],
    [-w / 2 + bevel * 1.4, thickness + 0.00004],
    [-w / 2, thickness - bevel],
    [-w / 2, bevel],
  ]
  const smooth = (a: number, b: number, x: number): number => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)
  }
  const ring = section(1).length
  const positions: number[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const y = y0 + (y1 - y0) * t
    let w = 0.0021 + 0.0011 * t
    if (t < 0.035) w *= Math.sqrt(Math.max(0.05, 1 - Math.pow(1 - t / 0.035, 2)))
    const gap = 0.0005 + 0.00065 * smooth(0.02, 0.4, t) - 0.00112 * smooth(0.84, 0.985, t)
    for (const [x, z] of section(w)) positions.push(x, y, R + gap + z)
  }
  const index: number[] = []
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < ring; k++) {
      const a = i * ring + k
      const b = i * ring + ((k + 1) % ring)
      const c = (i + 1) * ring + k
      const d = (i + 1) * ring + ((k + 1) % ring)
      index.push(a, c, b, b, c, d)
    }
  }
  // End caps as fans around each section centre.
  const capStart = positions.length / 3
  positions.push(0, y0, R + 0.0005 + thickness / 2)
  const capEnd = capStart + 1
  positions.push(0, y1, R + 0.0005 + 0.00065 - 0.00112 + thickness / 2)
  for (let k = 0; k < ring; k++) {
    index.push(capStart, k, (k + 1) % ring)
    index.push(capEnd, n * ring + ((k + 1) % ring), n * ring + k)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  return geometry
}

/** Contact bead under the clip nose: where the clip actually touches the barrel. */
export function clipBeadGeometry(detail: PencilDetail): THREE.SphereGeometry {
  const geometry = new THREE.SphereGeometry(0.00062, segments(detail, 24), segments(detail, 16))
  geometry.translate(0, ST.clipBase + 0.0011, R + 0.00052)
  return geometry
}

/** Eraser plug with a softly domed crown. */
export function eraserGeometry(detail: PencilDetail): THREE.LatheGeometry {
  return lathe(
    fillet([
      [0.0001, ST.eraserBase],
      [ERASER_R, ST.eraserBase + 0.0002],
      [ERASER_R, ST.eraserTop - 0.0002],
      [ERASER_R - 0.0003, ST.eraserTop],
      [0.0001, ST.eraserTop + 0.0002],
    ]),
    detail,
    40,
  )
}
