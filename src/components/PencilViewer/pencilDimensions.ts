/**
 * Aether Graph 0.5 proportions in meters. Single source of truth for the
 * pencil geometry, the teardown slots, and the responsive framing.
 *
 * The pencil is modelled along +Y with the lead point at y = 0 and the
 * knock button crown at y = LENGTH. Assembly centres it by CENTER_Y.
 * Comments carry the millimetre values a machinist would recognise.
 */

export const PENCIL_LENGTH = 0.142 // 142mm overall
export const PENCIL_BARREL_R = 0.0045 // 9.0mm barrel diameter
export const PENCIL_CENTER_Y = PENCIL_LENGTH / 2

/** Axial stations measured from the lead point (y = 0). */
export const ST = {
  leadPoint: 0,
  leadBase: 0.002,
  sleeveMouth: 0.0016,
  sleeveBase: 0.0056, // 4.0mm fixed sleeve
  noseBase: 0.0236, // 18mm nose cone
  clutchTop: 0.024,
  gripBase: 0.0236,
  gripTop: 0.0456, // 22mm knurled grip
  ringTop: 0.0476, // 2mm polished divider
  barrelTop: 0.1296, // 82mm barrel tube
  capTop: 0.1376,
  knockTop: 0.1406, // knock crown, 0.8mm proud of the cap
  eraserBase: 0.1256,
  eraserTop: 0.1316,
  shaftBase: 0.02,
  shaftTop: 0.115,
  springBase: 0.112,
  springTop: 0.124, // 12mm compression spring
  clipBase: 0.062,
  clipTop: 0.117,
} as const

export const LEAD_R = 0.00025 // 0.5mm lead
export const SLEEVE_R = 0.0009 // 0.9mm sleeve tube
export const NOSE_TIP_R = 0.0011
export const SHAFT_R = 0.0032
export const SPRING_COIL_R = 0.003
export const SPRING_WIRE_R = 0.00045
export const KNOCK_R = 0.00175
export const ERASER_R = 0.0026

/** Knurl band: 0.4mm diamond pitch cut 0.18mm deep into the grip. */
export const KNURL = { pitch: 0.0004, depth: 0.00018 } as const

/**
 * The ten teardown parts in physical order, tip to crown. Doubles as the
 * group-name union the film director writes every frame.
 */
export const PENCIL_PARTS = [
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
] as const

export type PencilPartId = (typeof PENCIL_PARTS)[number]

/** Hero-local Y of each part's visual centre (uncentred assembly space). */
export const PART_CENTER_Y: Record<PencilPartId, number> = {
  lead: 0.001,
  sleeve: 0.0036,
  nose: 0.0146,
  clutch: 0.018,
  grip: 0.0346,
  shaft: 0.0675,
  spring: 0.118,
  barrel: 0.0886,
  clip: 0.0895,
  cap: 0.1341,
}

/** Vertical silhouette height for a scale and x-rotation (long axis is Y). */
export function silhouetteHeightM(scale: number, rxRad: number): number {
  const c = Math.abs(Math.cos(rxRad))
  const s = Math.abs(Math.sin(rxRad))
  return scale * (PENCIL_LENGTH * c + PENCIL_BARREL_R * 2 * s)
}

/** Horizontal silhouette width for a scale and y-rotation. */
export function silhouetteWidthM(scale: number, ryRad: number): number {
  const c = Math.abs(Math.cos(ryRad))
  const s = Math.abs(Math.sin(ryRad))
  return scale * (PENCIL_BARREL_R * 2 * c + PENCIL_LENGTH * s)
}
