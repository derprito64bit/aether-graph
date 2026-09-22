import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  BEZEL,
  BODY_N,
  CHAMFER,
  COLLAR,
  DIM,
  DISPLAY_INSET,
  DISPLAY_PANEL,
  BACK_PANEL,
  BACK_FACE,
  FLASH_ARC,
  FRONT_GLASS,
  GLASS_SEAL,
  GRILLE_SLOT,
  LENSES,
  MIC_R,
  MODULE,
  MODULE_MIC,
  PANEL_SPLIT,
  PERISCOPE,
  PORT,
  SPEAKER_XS,
  TOF,
} from './phoneDimensions.ts'
import { buildMedallionGeometry } from './CameraAssembly.tsx'
import {
  createBezelGeometry,
  createFrameBodyGeometry,
  createFrameRingGeometry,
  createModuleBaseGeometry,
  createRoundedRectGeometry,
  createSlabGeometry,
  superellipseSlabGeometry,
} from './phoneGeometry.ts'

/**
 * Triangle budget, Prompt A section 11. Every entry mirrors the constructor
 * arguments in PhoneModel.tsx and CameraAssembly.tsx one to one; if those
 * change, this file must change in the same commit. Instanced meshes count
 * every instance. Draw calls and texture memory are recorded in
 * docs/device-perf.md alongside these numbers.
 */
function tris(geometry: THREE.BufferGeometry, instances = 1): number {
  const index = geometry.index
  const count = index !== null ? index.count / 3 : geometry.getAttribute('position').count / 3
  geometry.dispose()
  return count * instances
}

function box(w: number, h: number, d: number, instances = 1): number {
  return tris(new THREE.BoxGeometry(w, h, d), instances)
}

function lensTris(r: number, barrelDepth: number, baffles: number): number {
  let total = 0
  total += tris(new THREE.CylinderGeometry(r + 0.0009, r + 0.0012, 0.0006, 40))
  total += tris(new THREE.SphereGeometry(r, 40, 8, 0, Math.PI * 2, 0, 0.18))
  total += tris(new THREE.CylinderGeometry(r * 0.86, r * 0.8, barrelDepth, 32, 1, true))
  for (let i = 0; i < baffles; i++) {
    total += tris(new THREE.TorusGeometry(r * 0.78, 0.00022, 8, 32))
  }
  total += tris(new THREE.SphereGeometry(r * 0.6, 32, 8, 0, Math.PI * 2, 0, 1.1))
  total += tris(new THREE.RingGeometry(r * 0.3, r * 0.42, 7))
  total += tris(new THREE.CircleGeometry(r * 0.5, 24))
  total += tris(new THREE.RingGeometry(r + 0.0011, r + 0.0017, 40))
  return total
}

function buttonPocketTris(height: number, power: boolean): number {
  let total = 0
  total += tris(
    createRoundedRectGeometry(0.0003, height + 0.0002, 0.0004, 0.0017, CHAMFER.button, 0.00012),
  )
  total += tris(
    createSlabGeometry(0.0005, height, 0.0014, Math.min(0.00022, height / 2), CHAMFER.button),
  )
  total += box(0.0006, height + 0.0002, 0.0016)
  if (power) total += box(0.0001, 0.00006, 0.0002, 3)
  return total
}

function measure(detail: 'high' | 'low'): { total: number; rows: Array<[string, number]> } {
  const rows: Array<[string, number]> = []
  const add = (name: string, value: number): void => {
    rows.push([name, Math.round(value)])
  }
  const coarse = detail === 'low'

  add('frameBody', tris(createFrameBodyGeometry(BACK_FACE, coarse)))
  add('frameRing', tris(createFrameRingGeometry(coarse)))
  const panelW = DIM.w - BEZEL * 2
  const panelH = DIM.h - BEZEL * 2
  add(
    'backSlab',
    tris(superellipseSlabGeometry(0.03695, 0.07835, BODY_N, BACK_PANEL.depth, 0.0013)),
  )
  add('glassSlab', tris(superellipseSlabGeometry(0.0376, 0.079, BODY_N, FRONT_GLASS.depth, 0.0012)))
  add(
    'displaySlab',
    tris(superellipseSlabGeometry(0.036, 0.0774, BODY_N, DISPLAY_PANEL.depth, 0.0001)),
  )
  add('logo', tris(new THREE.PlaneGeometry(0.016, 0.004)))
  if (detail === 'high') {
    add('regulatory', tris(new THREE.PlaneGeometry(0.012, 0.0022)))
    add(
      'subpixel',
      tris(new THREE.PlaneGeometry(panelW - DISPLAY_INSET * 2, panelH - DISPLAY_INSET * 2)),
    )
  }
  add('panelGaps', box(DIM.w - 0.004, 0.00012, 0.0002, 2))

  // Circular module (Prompt A2): lathe base, two collar steps, seal,
  // instanced knurl, three lens tunnels, periscope, arc flash, ToF, mic,
  // iris medallion, bezel ring, worst-case panel split.
  let module = 0
  module += tris(createModuleBaseGeometry(MODULE.outerR, MODULE.proud, MODULE.baseFillet))
  module += tris(
    new THREE.CylinderGeometry(
      COLLAR.outer.rOut,
      COLLAR.outer.rOut,
      COLLAR.outer.rise,
      96,
      1,
      true,
    ),
  )
  module += tris(new THREE.RingGeometry(COLLAR.outer.rIn, COLLAR.outer.rOut, 96))
  module += tris(
    new THREE.CylinderGeometry(
      COLLAR.step.rOut,
      COLLAR.step.rOut,
      COLLAR.outer.rise - COLLAR.step.rise,
      96,
      1,
      true,
    ),
  )
  module += tris(new THREE.RingGeometry(COLLAR.step.rIn, COLLAR.step.rOut, 96))
  module += tris(
    new THREE.TorusGeometry(
      (GLASS_SEAL.rOut + GLASS_SEAL.rIn) / 2,
      (GLASS_SEAL.rOut - GLASS_SEAL.rIn) / 2,
      8,
      96,
    ),
  )
  module += tris(new THREE.CircleGeometry(COLLAR.glass.r, 96))
  if (detail === 'high') {
    module += tris(
      new THREE.BoxGeometry(COLLAR.outer.knurlDepth * 1.5, 0.00022, COLLAR.outer.rise * 0.8),
      COLLAR.outer.knurlTeeth,
    )
  }
  for (const lens of LENSES) {
    module += lensTris(lens.r, lens.barrelDepth, detail === 'high' ? 2 : 1)
  }
  // Medallion iris: six extruded blades plus the hairline ring.
  {
    const dummy = new THREE.MeshBasicMaterial()
    const medallion = buildMedallionGeometry(dummy, dummy)
    let medallionTris = 0
    medallion.traverse((child) => {
      if (child instanceof THREE.Mesh) medallionTris += tris(child.geometry)
    })
    module += medallionTris
    dummy.dispose()
  }
  // Periscope: cavity, window, prism, focus ring.
  module += box(PERISCOPE.w, PERISCOPE.h, PERISCOPE.cavityDepth + 0.0002)
  module += box(PERISCOPE.w, PERISCOPE.h, 0.00015)
  module += tris(new THREE.PlaneGeometry(PERISCOPE.w * 0.9, PERISCOPE.h * 1.6))
  if (detail === 'high') module += tris(new THREE.RingGeometry(0.0072, 0.0078, 40))
  // Arc flash: diffuser plus two dies.
  module += tris(
    new THREE.RingGeometry(
      FLASH_ARC.rIn,
      FLASH_ARC.rOut,
      24,
      1,
      0,
      (FLASH_ARC.sweepDeg * Math.PI) / 180,
    ),
  )
  module += tris(new THREE.CircleGeometry(0.0009, 16), FLASH_ARC.dies)
  // ToF window plus emitter, receiver, sensor edge.
  module += tris(createRoundedRectGeometry(TOF.window.w, TOF.window.h, TOF.window.r, 0.0002))
  if (detail === 'high') {
    module += tris(new THREE.CircleGeometry(TOF.emitter.d / 2, 20))
    module += tris(new THREE.CircleGeometry(TOF.receiver.d / 2, 20))
    module += tris(new THREE.PlaneGeometry(TOF.receiver.d * 0.55, TOF.receiver.d * 0.55))
  }
  module += tris(new THREE.CylinderGeometry(MODULE_MIC.d / 2, MODULE_MIC.d / 2, 0.0003, 12))
  add('cameraModule', module)

  // Bezel ink ring under the front glass.
  add('bezel', tris(createBezelGeometry(0.0376, 0.079, 0.036, 0.0774, 5)))

  // Panel split, worst case (Slate/Ember): seam groove plus proud lower panel.
  add(
    'panelSplit',
    box(DIM.w - 0.004, PANEL_SPLIT.seamWidth, 0.0003) +
      box(DIM.w - 0.004, PANEL_SPLIT.seamY + DIM.h / 2 - 0.002, 0.00024),
  )

  // Edge hardware.
  let edge = 0
  edge += buttonPocketTris(0.014, true)
  edge += buttonPocketTris(0.032, false)
  edge += box(0.0004, 0.0014, 0.004, 4)
  edge += box(0.0001, 0.0065, 0.0017)
  edge += box(0.0004, 0.0062, 0.0014)
  edge += tris(new THREE.CylinderGeometry(0.0003, 0.0003, 0.0004, 10))
  edge += tris(
    createRoundedRectGeometry(PORT.w, PORT.h, PORT.r, 0.0005, CHAMFER.portMouth, 0.00013),
  )
  edge += box(PORT.w - 0.0012, 0.0012, PORT.cavityDepth)
  if (detail === 'high') {
    edge += box(PORT.tongue.w, PORT.tongue.h, PORT.tongue.depth)
    edge += box(0.005, 0.0002, 0.0001)
  }
  edge += box(GRILLE_SLOT.w, GRILLE_SLOT.h, GRILLE_SLOT.depth, SPEAKER_XS.length)
  edge += tris(new THREE.CylinderGeometry(MIC_R, MIC_R, 0.0012, 12))
  edge += tris(new THREE.CylinderGeometry(0.00035, 0.00035, 0.001, 10))
  edge += box(0.003, 0.0005, 0.001)
  add('edgeHardware', edge)

  // Front sensors.
  let front = 0
  front += box(0.012, 0.0006, 0.00022)
  front += tris(new THREE.CylinderGeometry(0.0016, 0.0016, 0.00025, 24))
  front += tris(new THREE.RingGeometry(0.0016, 0.00175, 24))
  front += tris(new THREE.CircleGeometry(0.00028, 12))
  add('frontSensors', front)

  const total = rows.reduce((sum, [, value]) => sum + value, 0)
  return { total, rows }
}

describe('device triangle budget', () => {
  it('holds LOD0 under 120k triangles', () => {
    const { total, rows } = measure('high')
    console.log(`LOD0 triangle breakdown (total ${total.toLocaleString()}):`)
    for (const [name, value] of rows) {
      console.log(`  ${name}: ${value.toLocaleString()}`)
    }
    expect(total).toBeLessThan(120_000)
  })

  it('cuts real geometry at LOD1', () => {
    const high = measure('high')
    const low = measure('low')
    console.log(`LOD1 total ${low.total.toLocaleString()} vs LOD0 ${high.total.toLocaleString()}`)
    expect(low.total).toBeLessThan(high.total * 0.85)
    expect(low.total).toBeLessThan(60_000)
  })
})
