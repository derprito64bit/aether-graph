import { useFrame } from '@react-three/fiber'
import type { MotionValue } from 'motion/react'
import { useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { calloutBridge } from '../../film/overlay/callouts.ts'
import {
  PART_CENTER_Y,
  PENCIL_BARREL_R,
  PENCIL_CENTER_Y,
  ST,
  type PencilPartId,
} from './pencilDimensions.ts'
import type { PencilMaterialSet } from './pencilMaterials.ts'
import {
  barrelGeometry,
  capGeometry,
  chuckRingGeometry,
  clipGeometry,
  eraserGeometry,
  gripGeometry,
  jawGeometry,
  knockGeometry,
  leadGeometry,
  leadPointGeometry,
  noseGeometry,
  ringGeometry,
  shaftGeometry,
  sleeveGeometry,
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

/**
 * Procedurally built pencil. Pure geometry and materials; the mechanism
 * (knock press, jaw spread, lead advance) is a pure function of scroll
 * progress, so reverse scrubbing retraces it exactly.
 */
export function PencilModel({ materials, groups, detail = 'high', progress }: PencilModelProps) {
  const anchorObjs = useRef<Partial<Record<PencilPartId, THREE.Group>>>({})
  const jawRefs = useRef<Array<THREE.Mesh | null>>([])
  const knockRef = useRef<THREE.Mesh | null>(null)
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
      clip: clipGeometry(),
      eraser: eraserGeometry(detail),
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
    const knock = knockRef.current
    if (knock !== null) knock.position.y = -press * KNOCK_TRAVEL
    const slide = leadSlideRef.current
    if (slide !== null) slide.position.y = -advance
    const tilt = 0.08 + press * 0.12
    const r = 0.0011 + press * 0.0004
    for (let i = 0; i < jawRefs.current.length; i++) {
      const jaw = jawRefs.current[i]
      if (jaw === null || jaw === undefined) continue
      // Jaws live in static yaw pivots (local +X is radial): spread the
      // radius and lean the gripping tips outward with the press.
      jaw.position.x = r
      jaw.rotation.z = -tilt
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
          <mesh geometry={geo.chuck} material={m.clutch} position={[0, 0.0215, 0]} />
          {JAW_ANGLES.map((deg, i) => (
            <group key={deg} rotation={[0, (-deg * Math.PI) / 180, 0]}>
              <mesh
                ref={(mesh) => {
                  jawRefs.current[i] = mesh
                }}
                geometry={geo.jaw}
                material={m.clutch}
                position={[0.0011, ST.clutchTop - 0.011, 0]}
              />
            </group>
          ))}
        </group>
        <group ref={register('grip')}>
          <mesh geometry={geo.grip} material={m.grip} />
          <mesh geometry={geo.ring} material={m.ring} />
        </group>
        <group ref={register('shaft')}>
          <mesh
            geometry={geo.shaft}
            material={m.shaft}
            position={[0, (ST.shaftBase + ST.shaftTop) / 2, 0]}
          />
        </group>
        <group ref={register('spring')}>
          <mesh geometry={geo.spring} material={m.spring} />
        </group>
        <group ref={register('barrel')}>
          <mesh geometry={geo.barrel} material={m.barrel} />
        </group>
        <group ref={register('clip')}>
          {/* Blade floats just off the barrel on a sprung tilt: crown
              touching at the mount, free end standing proud. */}
          <mesh
            geometry={geo.clip}
            material={m.clip}
            position={[0, ST.clipBase, PENCIL_BARREL_R + 0.0012]}
            rotation={[-0.02, 0, 0]}
          />
          <mesh
            geometry={geo.chuck}
            material={m.clip}
            position={[0, ST.clipTop - 0.002, PENCIL_BARREL_R + 0.0002]}
            scale={[0.4, 0.3, 0.3]}
          />
        </group>
        <group ref={register('cap')}>
          <mesh geometry={geo.cap} material={m.cap} />
          <mesh geometry={geo.eraser} material={m.eraser} />
          <mesh ref={knockRef} geometry={geo.knock} material={m.cap} />
        </group>
      </group>
    </group>
  )
}
