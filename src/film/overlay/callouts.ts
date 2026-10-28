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
 * Shared bridge: written inside the Canvas (camera, part anchors, the
 * exploded-assembly balloon slots), read by the HTML overlay. Vectors are
 * allocated once here and overwritten in place every frame.
 */
export const calloutBridge: {
  camera: THREE.Camera | null
  anchors: Record<string, THREE.Group[]>
  occluders: THREE.Object3D[]
  canvasWidth: number
  canvasHeight: number
  balloons: Record<string, BalloonSlot>
  /** 0..1 how visible the assembly balloons are (exploded act envelope). */
  balloonOpacity: number
} = {
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
