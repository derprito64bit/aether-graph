import * as THREE from 'three'

export interface InspectHit {
  part: string
  readout: string
}

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let hasPointer = false
let lastTickMs = 0
let current: InspectHit | null = null

/** Records the pointer in normalized device coords. Called from canvas events. */
export function setInspectPointer(x: number, y: number): void {
  pointer.set(x, y)
  hasPointer = true
}

/** Clears the pointer when it leaves the canvas. */
export function clearInspectPointer(): void {
  hasPointer = false
  current = null
}

/** Returns the last resolved hit, or null. Rendered as a tooltip by the overlay. */
export function inspectHit(): InspectHit | null {
  return current
}

/**
 * Re-resolves the hover pick, at most every 150ms. Runs inside the director
 * when an x-ray act is active so a timeline move under a still cursor
 * re-picks without any React render.
 */
export function tickInspect(
  nowMs: number,
  camera: THREE.Camera,
  internals: THREE.Object3D | null,
): InspectHit | null {
  if (!hasPointer || internals === null || nowMs - lastTickMs < 150) return current
  lastTickMs = nowMs
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(internals.children, true)
  current = null
  for (const hit of hits) {
    let node: THREE.Object3D | null = hit.object
    while (node !== null) {
      const data = node.userData as { part?: string; readout?: string } | undefined
      if (data?.part !== undefined) {
        current = { part: data.part, readout: data.readout ?? data.part }
        break
      }
      node = node.parent
    }
    if (current !== null) break
  }
  return current
}
