import * as THREE from 'three'

/**
 * Exploded-diagram callouts (Prompt B section 6). Labels live in HTML,
 * anchored to part world positions and projected per frame; leader lines
 * draw in one SVG layer. Text never renders in WebGL.
 */
export interface CalloutDef {
  /** Matches an explode.ts part id. */
  partId: string
  title: string
  /** Every figure must already exist in src/data (tested). */
  body: string
  /** Lower hides first on collision. */
  priority: number
}

export interface CalloutLayout {
  partId: string
  /** Screen pixels. */
  x: number
  y: number
  /** Label offset side. */
  side: 'left' | 'right'
  visible: boolean
}

/** Shared bridge: written inside the Canvas, read by the HTML overlay. */
export const calloutBridge: {
  camera: THREE.Camera | null
  anchors: Record<string, THREE.Group[]>
  occluders: THREE.Object3D[]
  canvasWidth: number
  canvasHeight: number
} = { camera: null, anchors: {}, occluders: [], canvasWidth: 0, canvasHeight: 0 }

const scratch = new THREE.Vector3()

/**
 * Projects anchors to screen pixels with culling: behind camera,
 * off-screen (40px margin), and screen-space collision (lower priority
 * hides). Pure given the inputs; occlusion is resolved by the caller with
 * a throttled raycast. Tested in callouts.test.ts.
 */
export function layoutCallouts(
  defs: CalloutDef[],
  worldPositions: Map<string, THREE.Vector3>,
  camera: THREE.Camera,
  width: number,
  height: number,
): CalloutLayout[] {
  const placed: CalloutLayout[] = []
  const ordered = [...defs].sort((a, b) => a.priority - b.priority)
  for (const def of ordered) {
    const world = worldPositions.get(def.partId)
    if (world === undefined) {
      placed.push({ partId: def.partId, x: 0, y: 0, side: 'right', visible: false })
      continue
    }
    scratch.copy(world).project(camera)
    const behind = scratch.z > 1 || scratch.z < -1
    const x = ((scratch.x + 1) / 2) * width
    const y = ((1 - scratch.y) / 2) * height
    let visible = !behind && x > 40 && x < width - 40 && y > 40 && y < height - 40
    if (visible) {
      for (const other of placed) {
        if (!other.visible) continue
        if (Math.abs(other.x - x) < 96 && Math.abs(other.y - y) < 44) {
          visible = false
          break
        }
      }
    }
    placed.push({ partId: def.partId, x, y, side: x > width / 2 ? 'left' : 'right', visible })
  }
  return placed
}
