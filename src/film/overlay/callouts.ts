import * as THREE from 'three'

/** One part's balloon: where its leader lands and which way it stands off. */
export interface BalloonSlot {
  /** Leader landing point on the part, world space. */
  anchor: THREE.Vector3
  /** Unit direction the balloon stands off in, world space. */
  away: THREE.Vector3
}

const BALLOON_PARTS = [
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

/**
 * Margin-note anchors: drawing stations on the hero's axis (metres from the
 * lead point, as in pencilDimensions) and one point near the crown of each
 * finish-fan card. The director writes their world positions every frame.
 */
export const NOTE_STATIONS = {
  tip: 0.0004,
  sleeve: 0.0036,
  /** The lead inside the nose, where the clutch macro can see it. */
  lead: 0.009,
  nose: 0.012,
  clutch: 0.018,
  grip: 0.0346,
  balance: 0.058,
  shaft: 0.0675,
  barrel: 0.088,
  spring: 0.118,
  cap: 0.134,
} as const

export type NoteStation = keyof typeof NOTE_STATIONS
/** Fan cards in order: the graphite hero, then steel, brass, ember. */
export const FAN_ANCHORS = ['fan0', 'fan1', 'fan2', 'fan3'] as const
export type FanAnchor = (typeof FAN_ANCHORS)[number]
export type NoteAnchor = NoteStation | FanAnchor
/** Station of the fan labels: just under the cap, where the cards spread most. */
export const FAN_LABEL_STATION = 0.122

/**
 * Shared bridge: written inside the Canvas (camera, part anchors, the
 * exploded-assembly balloon slots, the margin-note anchors), read by the
 * HTML overlay. Vectors are allocated once here and overwritten in place
 * every frame.
 */
export const calloutBridge: {
  /** World positions of the margin-note anchors. */
  notes: Record<NoteAnchor, THREE.Vector3>
  camera: THREE.Camera | null
  anchors: Record<string, THREE.Group[]>
  occluders: THREE.Object3D[]
  canvasWidth: number
  canvasHeight: number
  balloons: Record<string, BalloonSlot>
  /** 0..1 how visible the assembly balloons are (exploded act envelope). */
  balloonOpacity: number
} = {
  notes: Object.fromEntries(
    [...Object.keys(NOTE_STATIONS), ...FAN_ANCHORS].map((id) => [id, new THREE.Vector3()]),
  ) as Record<NoteAnchor, THREE.Vector3>,
  camera: null,
  anchors: {},
  occluders: [],
  canvasWidth: 0,
  canvasHeight: 0,
  balloons: Object.fromEntries(
    BALLOON_PARTS.map((id) => [id, { anchor: new THREE.Vector3(), away: new THREE.Vector3() }]),
  ),
  balloonOpacity: 0,
}
