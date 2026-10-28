import { useFrame } from '@react-three/fiber'
import type { MotionValue } from 'motion/react'
import { useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { calloutBridge } from '../../film/overlay/callouts.ts'
import { SUB_TRAVEL, subAssemblyAt } from '../../film/teardown/assembly.ts'
import { PART_CENTER_Y, PENCIL_CENTER_Y, ST, type PencilPartId } from './pencilDimensions.ts'
import type { PencilMaterialSet } from './pencilMaterials.ts'
import {
  CLUTCH_SPRING_BASE,
  barrelGeometry,
  barrelThreadGeometry,
  capGeometry,
  chuckRingGeometry,
  clutchSpringGeometry,
  clipBeadGeometry,
  clipGeometry,
  eraserGeometry,
  gripGeometry,
  gripThreadGeometry,
  jawGeometry,
  knockGeometry,
  knurlBandGeometry,
  leadGeometry,
  leadPointGeometry,
  noseGeometry,
  ringGeometry,
  shaftGeometry,
  sleeveGeometry,
  spareLeadGeometry,
  springGeometry,
  type PencilDetail,
} from './pencilGeometry.ts'

/** Knock press 0..1 across the mechanism beat (pure function of progress). */
export function pressAt(p: number): number {
  const t = Math.min(1, Math.max(0, (p - 0.63) / 0.11))
  if (t <= 0 || t >= 1) return 0
  return Math.sin(t * Math.PI)
}

/** Lead advance in meters: extends 0.6mm, then stays out (pure, reversible). */
export function advanceAt(p: number): number {
  const t = Math.min(1, Math.max(0, (p - 0.65) / 0.07))
  const x = t * t * (3 - 2 * t)
  return 0.0006 * x
}

interface PencilModelProps {
  materials: PencilMaterialSet
  /** Shared part-group record so the film director can part the layers. */
  groups?: MutableRefObject<Record<PencilPartId, THREE.Group | null>>
  detail?: PencilDetail
  /** Film master progress. Drives the knock/clutch/lead mechanism. */
  progress?: MotionValue<number>
}

const JAW_ANGLES = [90, 210, 330]
const KNOCK_TRAVEL = 0.0012
/** Radial jaw travel at full press: enough to free a 0.5 mm lead. */
const JAW_OPEN = 0.00028
/** Collet seat: the gripping tips sit just behind the sleeve. */
const JAW_TIP_Y = ST.sleeveBase + 0.0062
/** Closing ring rides over the collet's cone head. */
const CHUCK_Y = JAW_TIP_Y + 0.0029

/**
 * Procedurally built pencil. Pure geometry and materials; the mechanism
 * (knock press, jaw spread, lead advance) is a pure function of scroll
 * progress, so reverse scrubbing retraces it exactly.
 */
export function PencilModel({ materials, groups, detail = 'high', progress }: PencilModelProps) {
  const anchorObjs = useRef<Partial<Record<PencilPartId, THREE.Group>>>({})
  const jawRefs = useRef<Array<THREE.Mesh | null>>([])
  const knockRef = useRef<THREE.Mesh | null>(null)
  const ringRef = useRef<THREE.Mesh | null>(null)
  const chuckRef = useRef<THREE.Mesh | null>(null)
  const eraserRef = useRef<THREE.Mesh | null>(null)
  const clutchSpringRef = useRef<THREE.Mesh | null>(null)
  const leadSlideRef = useRef<THREE.Group | null>(null)

  const geo = useMemo(
    () => ({
      barrel: barrelGeometry(detail),
      nose: noseGeometry(detail),
      grip: gripGeometry(detail),
      sleeve: sleeveGeometry(detail),
      cap: capGeometry(detail),
      knock: knockGeometry(detail),
      ring: ringGeometry(detail),
      shaft: shaftGeometry(detail),
      lead: leadGeometry(detail),
      point: leadPointGeometry(detail),
      spring: springGeometry(detail),
      jaw: jawGeometry(detail),
      chuck: chuckRingGeometry(detail),
      clip: clipGeometry(detail),
      bead: clipBeadGeometry(detail),
      eraser: eraserGeometry(detail),
      barrelThread: barrelThreadGeometry(detail),
      gripThread: gripThreadGeometry(detail),
      // Geometric knurl only where the GPU budget allows; low detail keeps
      // the normal map alone.
      knurl: detail === 'high' ? knurlBandGeometry() : null,
      clutchSpring: clutchSpringGeometry(detail),
      spareLeads: spareLeadGeometry(detail),
    }),
    [detail],
  )

  // Publish anchors for the HTML callout layer. Film-only: catalog
  // viewers share this component across several canvases, and only the
  // film's scene may publish. Published synchronously from the ref
  // callback (not an effect), so the map is populated from the very
  // first commit regardless of effect or suspense timing.
  const publishAnchors = progress !== undefined
  const republish = (): void => {
    if (!publishAnchors) return
    const map: Record<string, THREE.Group[]> = {}
    for (const [id, anchor] of Object.entries(anchorObjs.current)) {
      if (anchor !== null && anchor !== undefined) map[id] = [anchor]
    }
    calloutBridge.anchors = map
  }

  const register =
    (id: PencilPartId) =>
    (g: THREE.Group | null): void => {
      if (g === null) {
        delete anchorObjs.current[id]
      } else {
        // Visual-center anchor: an empty group riding inside the part at
        // its modelled centre. Rings and aim track the component itself
        // rather than the group's slot origin. Zero render cost.
        let anchor = anchorObjs.current[id]
        if (anchor === undefined) {
          anchor = new THREE.Group()
          anchor.position.set(0, PART_CENTER_Y[id], 0)
          anchorObjs.current[id] = anchor
          g.add(anchor)
        }
      }
      const ext = groups
      if (ext !== undefined) ext.current[id] = g
      republish()
    }

  useFrame(() => {
    const p = progress?.get()
    const press = p === undefined ? 0 : pressAt(p)
    // Viewers rest with the lead out; the film starts flush and advances it.
    const advance = p === undefined ? 0.0006 : advanceAt(p)
    // Sub-assemblies inside a part come apart in the exploded drawing:
    // ring off the grip, closing ring off the collet, knock and eraser out
    // of the cap. Pure function of progress; zero in the viewers.
    const capSub = p === undefined ? 0 : subAssemblyAt(p, 'cap')
    const knock = knockRef.current
    if (knock !== null) knock.position.y = -press * KNOCK_TRAVEL + capSub * SUB_TRAVEL.knock
    // The clutch spring compresses as the knock drives the collet forward.
    const clutchSpring = clutchSpringRef.current
    if (clutchSpring !== null) clutchSpring.scale.y = 1 - 0.32 * press
    const eraser = eraserRef.current
    if (eraser !== null) eraser.position.y = capSub * SUB_TRAVEL.eraser
    const ring = ringRef.current
    if (ring !== null)
      ring.position.y = (p === undefined ? 0 : subAssemblyAt(p, 'grip')) * SUB_TRAVEL.ring
    const chuck = chuckRef.current
    if (chuck !== null) {
      const clutchSub = p === undefined ? 0 : subAssemblyAt(p, 'clutch')
      chuck.position.y = CHUCK_Y + clutchSub * SUB_TRAVEL.chuckRing
    }
    const slide = leadSlideRef.current
    if (slide !== null) slide.position.y = -advance
    // The collet rests closed on the lead. A knock pushes it out of the
    // closing ring and the jaws open: each third slides out radially and
    // leans from its root so the gripping tips part the most.
    const spread = press * JAW_OPEN
    const lean = press * 0.045
    for (let i = 0; i < jawRefs.current.length; i++) {
      const jaw = jawRefs.current[i]
      if (jaw === null || jaw === undefined) continue
      // Jaws live in static yaw pivots (local +X is radial).
      jaw.position.x = spread
      jaw.rotation.z = lean
    }
  })

  const m = materials
  return (
    <group name="pencil">
      <group position={[0, -PENCIL_CENTER_Y, 0]}>
        <group ref={register('lead')}>
          <group ref={leadSlideRef}>
            <mesh geometry={geo.lead} material={m.lead} position={[0, 0.028, 0]} />
            <mesh
              geometry={geo.point}
              material={m.lead}
              position={[0, 0.0004, 0]}
              rotation={[Math.PI, 0, 0]}
            />
          </group>
        </group>
        <group ref={register('sleeve')}>
          <mesh geometry={geo.sleeve} material={m.sleeve} />
        </group>
        <group ref={register('nose')}>
          <mesh geometry={geo.nose} material={m.nose} />
        </group>
        <group ref={register('clutch')}>
          <mesh
            ref={chuckRef}
            geometry={geo.chuck}
            material={m.clutch}
            position={[0, CHUCK_Y, 0]}
          />
          <mesh
            ref={clutchSpringRef}
            geometry={geo.clutchSpring}
            material={m.spring}
            position={[0, JAW_TIP_Y + CLUTCH_SPRING_BASE, 0]}
          />
          {JAW_ANGLES.map((deg, i) => (
            <group key={deg} rotation={[0, (-deg * Math.PI) / 180, 0]}>
              <mesh
                ref={(mesh) => {
                  jawRefs.current[i] = mesh
                }}
                geometry={geo.jaw}
                material={m.clutch}
                position={[0, JAW_TIP_Y, 0]}
              />
            </group>
          ))}
        </group>
        <group ref={register('grip')}>
          <mesh geometry={geo.grip} material={m.grip} />
          {geo.knurl !== null ? (
            <mesh geometry={geo.knurl} material={m.grip} userData={{ noEdges: true }} />
          ) : null}
          <mesh geometry={geo.gripThread} material={m.grip} userData={{ noEdges: true }} />
          <mesh ref={ringRef} geometry={geo.ring} material={m.ring} />
        </group>
        <group ref={register('shaft')}>
          <mesh geometry={geo.shaft} material={m.shaft} />
          <mesh geometry={geo.spareLeads} material={m.lead} />
        </group>
        <group ref={register('spring')}>
          <mesh geometry={geo.spring} material={m.spring} />
        </group>
        <group ref={register('barrel')}>
          <mesh geometry={geo.barrel} material={m.barrel} />
          <mesh geometry={geo.barrelThread} material={m.barrel} userData={{ noEdges: true }} />
        </group>
        <group ref={register('clip')}>
          {/* Swept blade built in assembly space: it roots into the cap
              collar, stands proud through its middle, and rests on the
              barrel through the contact bead under its nose. */}
          <mesh geometry={geo.clip} material={m.clip} />
          <mesh geometry={geo.bead} material={m.clip} />
        </group>
        <group ref={register('cap')}>
          <mesh geometry={geo.cap} material={m.cap} />
          <mesh ref={eraserRef} geometry={geo.eraser} material={m.eraser} />
          <mesh ref={knockRef} geometry={geo.knock} material={m.cap} />
        </group>
      </group>
    </group>
  )
}
