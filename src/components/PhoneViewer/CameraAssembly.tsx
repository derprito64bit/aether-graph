import { useMemo, type MutableRefObject } from 'react'
import * as THREE from 'three'
import {
  CERAMIC_FACE_Z,
  COLLAR,
  FLASH_ARC,
  GLASS_SEAL,
  LENSES,
  LENS_RING_R,
  MEDALLION,
  MODULE,
  MODULE_MIC,
  OPTICS_PARTNER,
  PERISCOPE,
  TOF,
} from './phoneDimensions.ts'
import { createModuleBaseGeometry, createRoundedRectGeometry } from './phoneGeometry.ts'
import type { PhoneMaterialSet } from './phoneMaterials.ts'
import type { FocusLensId } from './PhoneConfig.tsx'

export interface OpticsControl {
  optics: number
  visible: boolean
}

export interface LensSpec {
  key: FocusLensId
  x: number
  y: number
  r: number
  coatHue: number
  barrelDepth: number
  elementZ: number
  glass: keyof Pick<PhoneMaterialSet, 'lensGlassA' | 'lensGlassB' | 'lensGlassC'>
}

const GLASS_FOR: Record<'main' | 'ultra' | 'mid', LensSpec['glass']> = {
  main: 'lensGlassA',
  ultra: 'lensGlassB',
  mid: 'lensGlassC',
}

/** Module center in phone meters. The module is centered, not offset. */
export function moduleCenter(): { x: number; y: number } {
  return { x: MODULE.cx, y: MODULE.cy }
}

/** Polar seat of a round lens in phone meters. */
export function lensSeat(angleDeg: number): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180
  const c = moduleCenter()
  return { x: c.x + LENS_RING_R * Math.cos(a), y: c.y + LENS_RING_R * Math.sin(a) }
}

/** Round lens seats in phone meters, derived from LENSES polar placement. */
export function lensSpecs(): LensSpec[] {
  return LENSES.map((lens) => {
    const seat = lensSeat(lens.angleDeg)
    return {
      key: lens.key,
      x: seat.x,
      y: seat.y,
      r: lens.r,
      coatHue: lens.coatHue,
      barrelDepth: lens.barrelDepth,
      elementZ: lens.elementZ,
      glass: GLASS_FOR[lens.key],
    }
  })
}

interface CameraAssemblyProps {
  materials: PhoneMaterialSet
  lensRefs: MutableRefObject<Partial<Record<FocusLensId, THREE.Group>>>
  /** Low drops instanced knurl, the second baffle, and ToF internals (mobile LOD). */
  detail?: 'high' | 'low'
  /**
   * Film-only optical separation refs (`${lens}:${layer}` plus `knurl`).
   * Viewers omit it; layers rest at their assembled offsets.
   */
  separation?: MutableRefObject<Record<string, THREE.Group | null>>
}

/**
 * Circular camera module (Prompt A2). Centered machined assembly: lathe base
 * with a G1 fillet, two collar steps (polished outer carrying arc text,
 * bead-blasted step), seal groove, cover glass with micro-text, three round
 * lens assemblies on a triangle, rectangular periscope, arc flash, ToF pair,
 * module mic, and an inlaid iris medallion. Rear faces -z.
 *
 * Layering note: the cover glass is semi-transparent so the medallion,
 * barrels, and baffles read through it dimmed, exactly like glass over
 * hardware. The ToF window, flash diffuser, mic, and periscope window are
 * separate sapphire windows sitting just proud of the glass, as on real
 * modules, which keeps each legible instead of stacked dimming.
 */
export function CameraAssembly({
  materials,
  lensRefs,
  detail = 'high',
  separation,
}: CameraAssemblyProps) {
  const specs = useMemo(() => lensSpecs(), [])
  const center = useMemo(() => moduleCenter(), [])
  const sep = useMemo(() => {
    const map = separation
    return (name: string) => (g: THREE.Group | null) => {
      if (map !== undefined) map.current[name] = g
    }
  }, [separation])
  const baseGeometry = useMemo(() => {
    const geo = createModuleBaseGeometry(MODULE.outerR, MODULE.proud, MODULE.baseFillet)
    geo.rotateX(-Math.PI / 2)
    geo.translate(center.x, center.y, CERAMIC_FACE_Z)
    return geo
  }, [center])
  const knurl = useMemo(() => {
    // One instanced wedge per tooth around the outer collar wall. Teeth
    // break the silhouette at macro (knurlDepth 0.18mm proud of the wall).
    const total = COLLAR.outer.knurlTeeth
    const geo = new THREE.BoxGeometry(
      COLLAR.outer.knurlDepth * 1.5,
      0.00022,
      COLLAR.outer.rise * 0.8,
    )
    const mesh = new THREE.InstancedMesh(geo, materials.collarOuter, total)
    const m = new THREE.Matrix4()
    const e = new THREE.Euler()
    const q = new THREE.Quaternion()
    const v = new THREE.Vector3()
    const sc = new THREE.Vector3(1, 1, 1)
    const r = COLLAR.outer.rOut + COLLAR.outer.knurlDepth * 0.2
    const z = CERAMIC_FACE_Z - COLLAR.outer.rise / 2
    for (let k = 0; k < total; k++) {
      const a = (k / total) * Math.PI * 2
      e.set(0, 0, a)
      q.setFromEuler(e)
      v.set(center.x + Math.cos(a) * r, center.y + Math.sin(a) * r, z)
      m.compose(v, q, sc)
      mesh.setMatrixAt(k, m)
    }
    mesh.instanceMatrix.needsUpdate = true
    return mesh
  }, [materials, center])
  const medallion = useMemo(
    () => buildMedallionGeometry(materials.medallion, materials.medallionRing),
    [materials],
  )
  const tofWindowGeometry = useMemo(
    () => createRoundedRectGeometry(TOF.window.w, TOF.window.h, TOF.window.r, 0.0002),
    [],
  )

  const zOuter = CERAMIC_FACE_Z - COLLAR.outer.rise
  const zStep = CERAMIC_FACE_Z - COLLAR.step.rise
  const zGlass = CERAMIC_FACE_Z - COLLAR.glass.rise
  const tofAngle = (TOF.angleDeg * Math.PI) / 180
  const tofX = center.x + TOF.ringR * Math.cos(tofAngle)
  const tofY = center.y + TOF.ringR * Math.sin(tofAngle)
  const micAngle = (MODULE_MIC.angleDeg * Math.PI) / 180
  const micX = center.x + MODULE_MIC.ringR * Math.cos(micAngle)
  const micY = center.y + MODULE_MIC.ringR * Math.sin(micAngle)

  return (
    <group>
      {/* Module base with machined fillet into the rear panel */}
      <mesh geometry={baseGeometry} castShadow>
        <primitive object={materials.island} attach="material" />
      </mesh>
      {/* Outer collar wall: instanced knurl at LOD0, mapped wall below */}
      <mesh
        position={[center.x, center.y, CERAMIC_FACE_Z - COLLAR.outer.rise / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry
          args={[COLLAR.outer.rOut, COLLAR.outer.rOut, COLLAR.outer.rise, 96, 1, true]}
        />
        <primitive
          object={detail === 'high' ? materials.collarOuter : materials.knurlWall}
          attach="material"
        />
      </mesh>
      {/* Outer collar top face: polished, carries the partner arc text */}
      <mesh position={[center.x, center.y, zOuter]}>
        <ringGeometry args={[COLLAR.outer.rIn, COLLAR.outer.rOut, 96]} />
        <primitive object={materials.collarTop} attach="material" />
      </mesh>
      {/* Step ring wall + matte bead-blasted top */}
      <mesh
        position={[center.x, center.y, zOuter - (COLLAR.outer.rise - COLLAR.step.rise) / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry
          args={[
            COLLAR.step.rOut,
            COLLAR.step.rOut,
            COLLAR.outer.rise - COLLAR.step.rise,
            96,
            1,
            true,
          ]}
        />
        <primitive object={materials.collarStep} attach="material" />
      </mesh>
      <mesh position={[center.x, center.y, zStep]}>
        <ringGeometry args={[COLLAR.step.rIn, COLLAR.step.rOut, 96]} />
        <primitive object={materials.collarStep} attach="material" />
      </mesh>
      {/* Seal groove: crisp dark hairline between glass and metal */}
      <mesh
        position={[center.x, center.y, zGlass - GLASS_SEAL.depth / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry
          args={[
            (GLASS_SEAL.rOut + GLASS_SEAL.rIn) / 2,
            (GLASS_SEAL.rOut - GLASS_SEAL.rIn) / 2,
            8,
            96,
          ]}
        />
        <primitive object={materials.glassSeal} attach="material" />
      </mesh>
      {/* Cover glass: semi-transparent so hardware reads through it dimmed */}
      <group ref={sep('module:cover')}>
        <mesh position={[center.x, center.y, zGlass]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[COLLAR.glass.r, 96]} />
          <primitive object={materials.moduleGlass} attach="material" />
        </mesh>
      </group>
      {detail === 'high' ? <primitive object={knurl} /> : null}
      {specs.map((spec) => (
        <LensAssembly
          key={spec.key}
          spec={spec}
          faceZ={CERAMIC_FACE_Z - MODULE.proud}
          materials={materials}
          lensRefs={lensRefs}
          detail={detail}
          sep={sep}
        />
      ))}
      <PeriscopeAssembly
        center={center}
        materials={materials}
        lensRefs={lensRefs}
        detail={detail}
        sep={sep}
      />
      {/* Arc flash: frosted diffuser arc bedded on the step ring with two
          LED dies proud of it. Dies sit 0.04mm off the diffuser plane
          (never coplanar); the ring softens their edge. */}
      <group
        position={[center.x, center.y, zStep - 0.00008]}
        rotation={[0, 0, (FLASH_ARC.startDeg * Math.PI) / 180]}
      >
        <mesh>
          <ringGeometry
            args={[FLASH_ARC.rIn, FLASH_ARC.rOut, 24, 1, 0, (FLASH_ARC.sweepDeg * Math.PI) / 180]}
          />
          <primitive object={materials.flashDiffuser} attach="material" />
        </mesh>
        {[0.3, 0.7].map((t) => {
          const a = t * ((FLASH_ARC.sweepDeg * Math.PI) / 180)
          const r = (FLASH_ARC.rIn + FLASH_ARC.rOut) / 2
          return (
            <mesh key={t} position={[Math.cos(a) * r, Math.sin(a) * r, -0.00004]}>
              <circleGeometry args={[0.0009, 16]} />
              <primitive object={materials.flashArc} attach="material" />
            </mesh>
          )
        })}
      </group>
      {/* ToF pair as its own proud window above the cover glass */}
      <group ref={sep('tof-module')} position={[tofX, tofY, zGlass - 0.00025]}>
        <mesh geometry={tofWindowGeometry} rotation={[0, 0, tofAngle]}>
          <primitive object={materials.tofWindow} attach="material" />
        </mesh>
        {detail === 'high' ? <ToFInternals materials={materials} angle={tofAngle} /> : null}
      </group>
      {/* Module mic: 0.7mm, felt not seen */}
      <mesh position={[micX, micY, zGlass - 0.0002]}>
        <cylinderGeometry args={[MODULE_MIC.d / 2, MODULE_MIC.d / 2, 0.0003, 12]} />
        <primitive object={materials.moduleMic} attach="material" />
      </mesh>
      {/* Iris medallion inlaid under the glass at the triangle centre */}
      <group position={[center.x, center.y, zGlass + MEDALLION.z]}>
        <primitive object={medallion} />
      </group>
    </group>
  )
}

/**
 * Six-blade iris medallion (Prompt A2 section 4.3, path A): six identical
 * straight-edged quadrilateral blades at 60 degrees with a fixed overlap
 * offset, so a hexagonal opening stays open at the centre. Real geometry:
 * crisp at 8cm, no texel grid. Brushing comes from the roughness map on the
 * shared medallion materials, which also dissolve with the shell.
 */
export function buildMedallionGeometry(
  bladeMaterial: THREE.Material,
  ringMaterial: THREE.Material,
): THREE.Group {
  const group = new THREE.Group()
  const R = MEDALLION.r
  const r0 = R * 0.3
  const overlap = 0.5
  for (let k = 0; k < 6; k++) {
    const a0 = (k * Math.PI) / 3
    const a1 = ((k + 1) * Math.PI) / 3
    const shape = new THREE.Shape()
    shape.moveTo(R * Math.cos(a0), R * Math.sin(a0))
    shape.lineTo(R * Math.cos(a1), R * Math.sin(a1))
    shape.lineTo(r0 * Math.cos(a1 + overlap), r0 * Math.sin(a1 + overlap))
    shape.lineTo(r0 * Math.cos(a0 + overlap), r0 * Math.sin(a0 + overlap))
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: MEDALLION.thickness,
      bevelEnabled: false,
    })
    group.add(new THREE.Mesh(geo, bladeMaterial))
  }
  group.add(new THREE.Mesh(new THREE.RingGeometry(R - MEDALLION.ringWidth, R, 72), ringMaterial))
  return group
}

/** Emitter/receiver apertures under the ToF window, barely perceptible. */
function ToFInternals({ materials, angle }: { materials: PhoneMaterialSet; angle: number }) {
  const e = TOF.emitter
  const r = TOF.receiver
  const ex = Math.cos(angle + (e.offsetDeg * Math.PI) / 180) * 0.0018
  const ey = Math.sin(angle + (e.offsetDeg * Math.PI) / 180) * 0.0018
  const rx = Math.cos(angle + (r.offsetDeg * Math.PI) / 180) * 0.0018
  const ry = Math.sin(angle + (r.offsetDeg * Math.PI) / 180) * 0.0018
  return (
    <group>
      {/* Apertures sit behind the window's rear face (never coplanar with
          it) and read through the filter dimly: barely perceptible. */}
      <mesh position={[ex, ey, 0.00016]}>
        <circleGeometry args={[e.d / 2, 20]} />
        <primitive object={materials.tofEmitter} attach="material" />
      </mesh>
      <mesh position={[rx, ry, 0.00016]}>
        <circleGeometry args={[r.d / 2, 20]} />
        <primitive object={materials.tofReceiver} attach="material" />
      </mesh>
      {/* Square sensor edge inside the receiver */}
      <mesh position={[rx, ry, 0.00018]}>
        <planeGeometry args={[r.d * 0.55, r.d * 0.55]} />
        <primitive object={materials.tofHousing} attach="material" />
      </mesh>
    </group>
  )
}

/**
 * Folded periscope optic (Prompt A2 section 2.5): rounded-rectangle window
 * proud of the cover glass, angled prism floor catching one fast highlight,
 * dark ramped interior. Registers the fourth focusable lens id.
 */
function PeriscopeAssembly({
  center,
  materials,
  lensRefs,
  detail,
  sep,
}: {
  center: { x: number; y: number }
  materials: PhoneMaterialSet
  lensRefs: MutableRefObject<Partial<Record<FocusLensId, THREE.Group>>>
  detail: 'high' | 'low'
  sep: (name: string) => (g: THREE.Group | null) => void
}) {
  const x = center.x + PERISCOPE.x
  const y = center.y + PERISCOPE.y
  const zFace = CERAMIC_FACE_Z - MODULE.proud
  const zGlass = CERAMIC_FACE_Z - COLLAR.glass.rise
  const zWindow = zGlass - 0.00015
  const zFloor = zGlass + PERISCOPE.cavityDepth
  return (
    <group
      position={[x, y, 0]}
      ref={(group: THREE.Group | null) => {
        if (group !== null) lensRefs.current.periscope = group
      }}
    >
      <group ref={sep('periscope:cover')}>
        {/* Cavity walls: an open frame, never a solid box (a solid bricks
            over the prism). The window covers the top, the prism closes the
            bottom; looking in reads folded optics. */}
        {[
          { x: 0, y: PERISCOPE.h / 2, w: PERISCOPE.w, h: 0.0004 },
          { x: 0, y: -PERISCOPE.h / 2, w: PERISCOPE.w, h: 0.0004 },
          { x: -PERISCOPE.w / 2, y: 0, w: 0.0004, h: PERISCOPE.h },
          { x: PERISCOPE.w / 2, y: 0, w: 0.0004, h: PERISCOPE.h },
        ].map(({ x, y, w, h }) => (
          <mesh key={`${x},${y}`} position={[x, y, (zWindow + zFloor) / 2]}>
            <boxGeometry args={[w, h, PERISCOPE.cavityDepth + 0.0002]} />
            <primitive object={materials.lensCavity} attach="material" />
          </mesh>
        ))}
        {/* Cover window, a separate sapphire pane above the module glass */}
        <mesh position={[0, 0, zWindow]}>
          <boxGeometry args={[PERISCOPE.w, PERISCOPE.h, 0.00015]} />
          <primitive object={materials.periscopeGlass} attach="material" />
        </mesh>
      </group>
      <group ref={sep('periscope:prism')}>
        {/* Prism floor tilted 40 degrees off the rear axis: no straight-down
            view, one fast hard highlight as the camera arcs. */}
        <mesh
          position={[0, 0, zFloor]}
          rotation={[Math.PI - (PERISCOPE.prismAngleDeg * Math.PI) / 180, 0, 0]}
        >
          <planeGeometry args={[PERISCOPE.w * 0.9, PERISCOPE.h * 1.6]} />
          <primitive object={materials.periscopePrism} attach="material" />
        </mesh>
        {detail === 'high' ? (
          <mesh position={[0, 0, zFace]} name="focus-ring">
            <ringGeometry args={[0.0072, 0.0078, 40]} />
            <primitive object={materials.focusRing} attach="material" />
          </mesh>
        ) : null}
      </group>
    </group>
  )
}

/**
 * One parametric optical assembly built outward from the module face (z0,
 * decreasing z is outward). Cover dome, collar, depth-ramped barrel, two
 * baffles at 35/70 percent of barrel depth, front element at elementZ,
 * aperture hint, sensor plane: the receding-ring tunnel. Called three
 * times, never modelled twice.
 */
function LensAssembly({
  spec,
  faceZ,
  materials,
  lensRefs,
  detail,
  sep,
}: {
  spec: LensSpec
  faceZ: number
  materials: PhoneMaterialSet
  lensRefs: CameraAssemblyProps['lensRefs']
  detail: 'high' | 'low'
  sep: (name: string) => (g: THREE.Group | null) => void
}) {
  const glass = materials[spec.glass]
  const z0 = faceZ
  const mouth = z0 + 0.0001
  return (
    <group
      position={[spec.x, spec.y, 0]}
      ref={(group: THREE.Group | null) => {
        if (group !== null) lensRefs.current[spec.key] = group
      }}
    >
      {/* Collar ring, proud 0.35mm */}
      <group ref={sep(`${spec.key}:collar`)}>
        <mesh position={[0, 0, z0 - 0.00005]} castShadow>
          <cylinderGeometry args={[spec.r + 0.0009, spec.r + 0.0012, 0.0006, 40]} />
          <primitive object={materials.lensRing} attach="material" />
        </mesh>
      </group>
      {/* Cover dome at the collar top: highlight slides, never pops */}
      <group ref={sep(`${spec.key}:cover`)}>
        <mesh position={[0, 0, z0 - 0.00035]} rotation={[-Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[spec.r, 40, 8, 0, Math.PI * 2, 0, 0.18]} />
          <primitive object={glass} attach="material" />
        </mesh>
      </group>
      {/* Barrel wall plus baffles, descending into the module */}
      <group ref={sep(`${spec.key}:barrel`)}>
        <mesh position={[0, 0, mouth + spec.barrelDepth / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[spec.r * 0.86, spec.r * 0.8, spec.barrelDepth, 32, 1, true]} />
          <primitive object={materials.lensBarrel} attach="material" />
        </mesh>
        {/* Baffle rings at 35/70 percent of barrel depth (one on low LOD) */}
        {(detail === 'high' ? [0.35, 0.7] : [0.5]).map((depth) => (
          <mesh key={depth} position={[0, 0, mouth + spec.barrelDepth * depth]}>
            <torusGeometry args={[spec.r * 0.78, 0.00022, 8, 32]} />
            <primitive object={materials.lensBarrel} attach="material" />
          </mesh>
        ))}
      </group>
      {/* Front element at its per-lens depth */}
      <group ref={sep(`${spec.key}:element`)}>
        <mesh position={[0, 0, mouth - spec.elementZ]} rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[spec.r * 0.6, 32, 8, 0, Math.PI * 2, 0, 1.1]} />
          <primitive object={glass} attach="material" />
        </mesh>
      </group>
      {/* Aperture hint plus sensor plane */}
      <group ref={sep(`${spec.key}:sensor`)}>
        <mesh position={[0, 0, mouth + spec.barrelDepth * 0.8]} rotation={[0, Math.PI, 0]}>
          <ringGeometry args={[spec.r * 0.3, spec.r * 0.42, 7]} />
          <primitive object={materials.lensCavity} attach="material" />
        </mesh>
        <mesh position={[0, 0, mouth + spec.barrelDepth]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[spec.r * 0.5, 24]} />
          <primitive object={materials.sensorGlint} attach="material" />
        </mesh>
      </group>
      <mesh position={[0, 0, z0 - 0.00035]} rotation={[0, Math.PI, 0]} name="focus-ring">
        <ringGeometry args={[spec.r + 0.0011, spec.r + 0.0017, 40]} />
        <primitive object={materials.focusRing} attach="material" />
      </mesh>
    </group>
  )
}

/** Partner wordmark for the collar arc text. Recorded in docs/device-design.md. */
export const PARTNER_MARK = OPTICS_PARTNER
