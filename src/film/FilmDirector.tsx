import { useFrame } from '@react-three/fiber'
import type { MotionValue } from 'motion/react'
import { useLayoutEffect, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { PencilPartId } from '../components/PencilViewer/pencilDimensions.ts'
import type { PencilMaterialSet } from '../components/PencilViewer/pencilMaterials.ts'
import { centerBias, fitFov, macroFloorFov } from './framing.ts'
import { SHOTS, capAngularStep } from './shots.ts'
import { STAGE_LIGHTING } from './lighting.ts'
import { clearInspectPointer, setInspectPointer } from './inspect.ts'
import { computeFilmStates } from './states.ts'
import { calloutBridge } from './overlay/callouts.ts'
import { actAt } from './timeline.ts'
import { TEARDOWN_LAYERS } from './teardown/layers.ts'
import {
  CLIP_LIFT,
  ROW_OFFSET,
  assemblyDistance,
  FEATURE_LIFT,
  assemblyLift,
  featurePose,
  featureScale,
  layoutAssembly,
  SUB_MARGIN,
  spreadAt,
  type AssemblyLayout,
  type AssemblyPart,
  type FeaturePose,
  type PartExtent,
  uprightRz,
} from './teardown/assembly.ts'
import { sampleFilm } from './sample.ts'
import { cardPose, type CardPose } from './finishFan.ts'
import { PENCIL_BARREL_R, PENCIL_CENTER_Y } from '../components/PencilViewer/pencilDimensions.ts'

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Outer shell materials that dissolve together for the x-ray flash at the
 * teardown entry. The mechanism (lead, sleeve, clutch, spring, shaft,
 * eraser) stays solid throughout: it is the subject of the reveal.
 */
const SHELL_MATS = [
  'barrel',
  'grip',
  'nose',
  'cap',
  'clip',
  'ring',
] as const satisfies ReadonlyArray<keyof PencilMaterialSet>

/** Context recede map: every teardown layer owns its materials outright. */
const RECEDE_MATS: Partial<Record<string, ReadonlyArray<keyof PencilMaterialSet>>> = {
  lead: ['lead'],
  sleeve: ['sleeve'],
  nose: ['nose'],
  clutch: ['clutch'],
  grip: ['grip'],
  shaft: ['shaft'],
  spring: ['spring'],
  barrel: ['barrel'],
  clip: ['clip'],
  cap: ['cap', 'eraser'],
}

/** Rest opacity for every pencil material. The pencil carries no glass. */
const BASE_OPACITY: Partial<Record<keyof PencilMaterialSet, number>> = {}

/** No translucent optics on the pencil: everything writes depth. */
const NO_DEPTH_WRITE: ReadonlySet<string> = new Set([])

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** Screens narrower than this stand the exploded drawing upright. */
const UPRIGHT_ASPECT = 0.9

/**
 * Where each part's balloon leader lands along the part (0 tip end, 1 crown
 * end) and which way the balloon stands off, in assembly space (+X is the
 * mechanism row's side, +Y the crown). The barrel's balloon sits at its
 * tip end so it never meets the clip's above it.
 */
const BALLOON: Record<AssemblyPart, { at: number; away: [number, number] }> = {
  sleeve: { at: 0.5, away: [-1, -0.25] },
  nose: { at: 0.5, away: [-1, 0] },
  grip: { at: 0.45, away: [-1, 0] },
  barrel: { at: 0.08, away: [-1, -0.35] },
  cap: { at: 0.5, away: [-1, 0.2] },
  clip: { at: 0.72, away: [-1, 0] },
  lead: { at: 0.55, away: [1, 0] },
  clutch: { at: 0.5, away: [1, 0] },
  shaft: { at: 0.5, away: [1, 0] },
  spring: { at: 0.5, away: [1, 0.2] },
}

/** Rest geometry of one part, measured once from its meshes (assembly space). */
interface PartRest {
  center: THREE.Vector3
  length: number
}

/**
 * Measures a part group's meshes in its parent's space (the assembly frame)
 * while the group is still at rest. The drawing layers SketchReveal adds
 * share the same geometry, so they are skipped.
 */
function measurePart(
  group: THREE.Group,
  box: THREE.Box3,
  tmp: THREE.Box3,
  rel: THREE.Matrix4,
): void {
  box.makeEmpty()
  group.updateWorldMatrix(true, true)
  const inv = rel.copy(group.matrixWorld).invert()
  const m = new THREE.Matrix4()
  group.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (!mesh.isMesh || mesh.userData.sketch === true) return
    const geometry = mesh.geometry
    if (geometry.boundingBox === null) geometry.computeBoundingBox()
    if (geometry.boundingBox === null) return
    m.multiplyMatrices(inv, mesh.matrixWorld)
    tmp.copy(geometry.boundingBox).applyMatrix4(m)
    box.union(tmp)
  })
  // Group-local equals the parent (assembly) frame while the group is at rest.
}

export interface FilmRefs {
  hero: MutableRefObject<THREE.Group | null>
  parts: MutableRefObject<Record<PencilPartId, THREE.Group | null>>
  keyLight: MutableRefObject<THREE.DirectionalLight | null>
  fillLight: MutableRefObject<THREE.DirectionalLight | null>
  rimLight: MutableRefObject<THREE.DirectionalLight | null>
  accentLight: MutableRefObject<THREE.DirectionalLight | null>
  parallaxX: MotionValue<number>
  parallaxY: MotionValue<number>
  /** Finish fan: a root that mirrors the hero, one pivot per variant pencil. */
  variantRoot: MutableRefObject<THREE.Group | null>
  variantPivots: MutableRefObject<Array<THREE.Group | null>>
  variantMaterials: PencilMaterialSet[]
}

interface FilmDirectorProps {
  progress: MotionValue<number>
  materials: PencilMaterialSet
  refs: FilmRefs
}

/**
 * Single frame director: samples the master timeline, then writes camera,
 * pose, responsive FOV, x-ray dissolve, and lighting without any React
 * render. MotionValues and refs only.
 */
export function FilmDirector({ progress, materials, refs }: FilmDirectorProps) {
  const scratch = useRef({
    look: new THREE.Vector3(),
    camPos: new THREE.Vector3(0, 0, 0.9),
    camReady: false,
    env: 0.9,
    key: 2.2,
    fill: 0.7,
    rim: 1.1,
    accent: 0,
    tint: new THREE.Color('#ffffff'),
    tintTarget: new THREE.Color('#ffffff'),
    accentTarget: new THREE.Color('#ffffff'),
    pose: { lift: 0, spin: 0 } as FeaturePose,
    card: { lean: 0, depth: 0, opacity: 0 } as CardPose,
    layout: null as AssemblyLayout | null,
    rest: {} as Record<AssemblyPart, PartRest>,
    box: new THREE.Box3(),
    tmpBox: new THREE.Box3(),
    rel: new THREE.Matrix4(),
    partGoal: new THREE.Vector3(),
    partCenter: new THREE.Vector3(),
    asmCenter: new THREE.Vector3(),
    asmAim: new THREE.Vector3(),
    asmCam: new THREE.Vector3(),
    featureWorld: new THREE.Vector3(),
    upWorld: new THREE.Vector3(0, 1, 0),
    innerQ: new THREE.Quaternion(),
    featureLift: 0,
    lifts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as number[],
    asmFrameW: 0,
    balloonAnchor: new THREE.Vector3(),
    focus: new THREE.Vector3(),
    focusHalfM: 0.01,
    pushW: 0,
    aimGoal: new THREE.Vector3(),
    camGoal: new THREE.Vector3(),
    camDir: new THREE.Vector3(),
    axisV: new THREE.Vector3(),
    heroQ: new THREE.Quaternion(),
    prepared: false,
  })

  // Measure every part once, at true rest. A layout effect runs after the
  // model's groups and meshes exist and before any frame: measuring inside
  // a frame instead would see the sub-assemblies, the knock, and the lead
  // already moved for the current scroll position, so a deep link into the
  // exploded act would draw a different picture than scrolling there.
  useLayoutEffect(() => {
    const s = scratch.current
    const extents = {} as Record<AssemblyPart, PartExtent>
    for (const layer of TEARDOWN_LAYERS) {
      const id = layer.id as AssemblyPart
      const group = refs.parts.current[id]
      if (group === null || group === undefined) return
      measurePart(group, s.box, s.tmpBox, s.rel)
      const center = new THREE.Vector3()
      s.box.getCenter(center)
      s.rest[id] = { center, length: s.box.max.y - s.box.min.y }
      extents[id] = { minY: s.box.min.y, maxY: s.box.max.y }
    }
    s.layout = layoutAssembly(extents, PENCIL_CENTER_Y)
  }, [refs])

  useFrame((state, delta) => {
    const s = scratch.current
    if (!s.prepared) {
      s.prepared = true
      for (const name of SHELL_MATS) {
        materials[name].transparent = true
      }
    }
    const reduced = window.matchMedia(REDUCED_QUERY).matches
    const p = progress.get()
    const t = sampleFilm(p)
    const st = computeFilmStates(p)
    const act = actAt(p).id

    const shot = SHOTS[act] ?? SHOTS.hero
    const damp = reduced ? 1 : 1 - Math.exp(-delta * shot.dampPerSecond)
    const lookDamp = reduced ? 1 : 1 - Math.exp(-delta * shot.targetDampPerSecond)
    const capRot = (current: number, goal: number): number =>
      reduced ? goal : capAngularStep(current, goal, shot.maxAngularVelocity, delta)

    // Feature focus: during the exploded feature run, hand a share of
    // the aim to the featured part and dolly in behind it. During the
    // mechanism act the same machinery locks onto the free-floating
    // clutch instead, so the macro tracks the part rather than hoping
    // the authored keys land on it. Pure functions of scroll progress,
    // so scrubbing retraces every move exactly. Skipped under reduced
    // motion (the snapped film holds the authored frame).
    let focusPush = 0
    let aimShare = 0.55
    let dollyFloor = 0.72
    if (!reduced && act === 'mechanism') {
      const anchor = calloutBridge.anchors['clutch']?.[0]
      if (anchor !== null && anchor !== undefined) {
        anchor.getWorldPosition(s.focus)
        // Hero-scale aware: the macro runs at ~2x, the part is twice the
        // size the manifest half-height names.
        s.focusHalfM = 0.006 * t.scale
        focusPush = st.cameraFocus
        aimShare = 0.7
        dollyFloor = 0.35
      }
    }

    const cam = state.camera as THREE.PerspectiveCamera
    const aspect = state.size.width / Math.max(1, state.size.height)
    // Contextual push: during a feature beat the camera leans toward the
    // featured part while the whole stack stays framed. The goal blends
    // from the authored drift (wide) toward the part vantage on the
    // feature envelope, so scrubbing retraces the move exactly. The push
    // never goes closer than 72% of the authored distance: the exploded
    // diagram must remain legible behind the featured part.
    s.camGoal.copy(t.pos)
    s.pushW = 0
    if (focusPush > 0.01) {
      s.camDir.copy(t.pos).sub(s.focus)
      const authoredDist = Math.max(0.05, s.camDir.length())
      s.camDir.copy(s.camPos).sub(s.focus)
      if (s.camDir.lengthSq() > 1e-8) {
        s.camDir.normalize()
        // Mechanism macro goes side-on: approaching down the pencil axis
        // parks the lens inside the barrel with the clutch hidden behind
        // it. Orthogonalize the vantage against the pencil axis so the
        // jaws face the camera. Exploded beats keep the authored drift.
        if (act === 'mechanism' && refs.hero.current !== null) {
          refs.hero.current.getWorldQuaternion(s.heroQ)
          s.axisV.set(0, 1, 0).applyQuaternion(s.heroQ)
          s.camDir.addScaledVector(s.axisV, -s.camDir.dot(s.axisV))
          if (s.camDir.lengthSq() < 1e-6) s.camDir.set(1, 0, 0)
          s.camDir.normalize()
        }
        const halfFov = (t.fov * Math.PI) / 180 / 2
        const partDist = THREE.MathUtils.clamp(
          (s.focusHalfM * 2.4) / Math.max(0.05, Math.tan(halfFov)),
          0.05,
          0.6,
        )
        // Never closer than the floor of the authored distance: the full
        // exploded stack must stay framed behind the featured part (the
        // mechanism macro opts into a tighter floor for its close-up).
        const dist = Math.max(partDist, authoredDist * dollyFloor)
        s.camGoal.copy(s.focus).addScaledVector(s.camDir, dist)
        const w = Math.min(1, Math.max(0, focusPush))
        const we = w * w * (3 - 2 * w)
        // Component-wise blend (no temp vector, no aliasing): wide drift
        // at we = 0, isolated part vantage at we = 1.
        s.camGoal.set(
          t.pos.x + (s.camGoal.x - t.pos.x) * we,
          t.pos.y + (s.camGoal.y - t.pos.y) * we,
          t.pos.z + (s.camGoal.z - t.pos.z) * we,
        )
        s.pushW = we
      }
    }
    if (s.asmFrameW > 0.001) s.camGoal.lerp(s.asmCam, s.asmFrameW)
    // Position glides: a hard flick through a fast move travels instead of
    // teleporting. Tracks smooth scroll invisibly at 7/s; snaps under
    // reduced motion.
    if (reduced || !s.camReady) {
      s.camPos.copy(t.pos)
      s.camReady = true
      cam.position.copy(t.pos)
    } else {
      const pd = 1 - Math.exp(-delta * 7)
      s.camPos.x += (s.camGoal.x - s.camPos.x) * pd
      s.camPos.y += (s.camGoal.y - s.camPos.y) * pd
      s.camPos.z += (s.camGoal.z - s.camPos.z) * pd
      cam.position.copy(s.camPos)
    }
    // Aim settles late: damped slower than pose so the eye leads. During
    // the exploded run every part lands on the same showcase spot at
    // right of frame, so beats line up with each other instead of
    // wandering. The spot is a fixed view-space offset from the part,
    // blended in on the feature envelope. Other beats keep the share.
    s.aimGoal.copy(t.target)
    if (focusPush > 0) {
      s.aimGoal.lerp(s.focus, Math.min(aimShare, aimShare * focusPush))
    }
    // Exploded assembly owns the camera inside its envelope: the aim and
    // the position blend from the authored keys to the drawing's framing
    // (computed below from last frame's part layout, which is stable).
    if (s.asmFrameW > 0.001) {
      const w = s.asmFrameW
      s.aimGoal.lerp(s.asmAim, w)
    }
    s.look.x += (s.aimGoal.x - s.look.x) * lookDamp
    s.look.y += (s.aimGoal.y - s.look.y) * lookDamp
    s.look.z += (s.aimGoal.z - s.look.z) * lookDamp
    // Pointer parallax: small clamped offset applied at lookAt time, never
    // stored, so it cannot accumulate inside the damped aim.
    let lookX = s.look.x
    let lookY = s.look.y
    if (!reduced) {
      lookX += THREE.MathUtils.clamp(refs.parallaxX.get(), -0.5, 0.5) * 0.016
      lookY += THREE.MathUtils.clamp(refs.parallaxY.get(), -0.5, 0.5) * 0.012
    }
    cam.lookAt(lookX, lookY, s.look.z)

    const bx = centerBias(aspect, 'x')
    const by = centerBias(aspect, 'y')
    const px = t.fit !== null ? t.px * bx : t.px
    const py = t.fit !== null ? t.py * by : t.py

    const g = refs.hero.current
    // The exploded keys lay the pencil horizontal (tip left). Tall screens
    // stand the drawing upright instead, on the lay-down envelope, so the
    // long axis runs up the frame and the rows sit side by side.
    const upright = aspect < UPRIGHT_ASPECT
    const rzGoal = upright ? uprightRz(p, t.rz) : t.rz
    if (g !== null) {
      if (reduced) {
        g.rotation.set(t.rx, t.ry, rzGoal)
        g.scale.setScalar(t.scale)
        g.position.set(px, py, 0)
      } else {
        // Damped toward the sampled pose, then capped: a hard flick gets a
        // fast controlled move, never a whip.
        g.rotation.x = capRot(g.rotation.x, g.rotation.x + (t.rx - g.rotation.x) * damp)
        g.rotation.y = capRot(g.rotation.y, g.rotation.y + (t.ry - g.rotation.y) * damp)
        g.rotation.z = capRot(g.rotation.z, g.rotation.z + (rzGoal - g.rotation.z) * damp)
        const ns = t.scale
        g.scale.x += (ns - g.scale.x) * damp
        g.scale.y += (ns - g.scale.y) * damp
        g.scale.z += (ns - g.scale.z) * damp
        g.position.x += (px - g.position.x) * damp
        g.position.y += (py - g.position.y) * damp
      }
    }

    // Finish fan: the variant root mirrors the hero's damped pose, and each
    // card leans about the grip and steps back a layer, in sequence. Pure
    // function of progress through the fan envelope.
    const vroot = refs.variantRoot.current
    if (vroot !== null && g !== null) {
      const fan = reduced ? (st.finishFan > 0 ? 1 : 0) : st.finishFan
      vroot.visible = fan > 0.002
      if (vroot.visible) {
        vroot.position.copy(g.position)
        vroot.quaternion.copy(g.quaternion)
        vroot.scale.copy(g.scale)
        refs.variantPivots.current.forEach((pivot, k) => {
          if (pivot === null) return
          cardPose(fan, k, s.card)
          pivot.rotation.z = s.card.lean
          pivot.position.z = s.card.depth
          pivot.visible = s.card.opacity > 0.01
          const set = refs.variantMaterials[k]
          if (set !== undefined) {
            for (const mat of Object.values(set)) mat.opacity = s.card.opacity
          }
        })
      }
    }

    const distance = cam.position.distanceTo(s.look)
    let targetFov = t.fov
    if (t.fit !== null) {
      const fitValue = fitFov({
        fit: t.fit,
        distanceM: distance,
        aspect,
        scale: t.scale,
        rxRad: t.rx,
        ryRad: t.ry,
        pxM: t.px,
        maxFovDeg: t.fovMax,
      })
      const w = Math.min(1, Math.max(0, t.fit))
      targetFov = Math.min(t.fovMax, t.fov + (fitValue - t.fov) * w)
    }
    // Feature close-up owns its lens: the fit solver frames the whole
    // (foreshortened) pencil and would collapse the FOV onto it, undoing
    // the push. Blend back to the authored FOV on the push envelope so
    // the transition stays continuous in both directions.
    // Inside the exploded act the drawing's framing owns the lens (it sizes
    // the shot for the authored FOV); the keys keep a responsive fit so the
    // act's edges hand over without a lens step.
    if (s.asmFrameW > 0.001) targetFov += (t.fov - targetFov) * s.asmFrameW
    if (s.pushW > 0.001) {
      const bx = Math.min(1, Math.max(0, (s.pushW - 0.4) / 0.2))
      const be = bx * bx * (3 - 2 * bx)
      targetFov += (t.fov - targetFov) * be
    }
    if (aspect < 0.8) {
      const floor = macroFloorFov(p, distance, aspect)
      if (floor > targetFov) targetFov = floor
    }
    if (reduced) {
      if (Math.abs(cam.fov - targetFov) > 0.001) {
        cam.fov = targetFov
        cam.updateProjectionMatrix()
      }
    } else if (Math.abs(cam.fov - targetFov) > 0.01) {
      const damped = cam.fov + (targetFov - cam.fov) * (1 - Math.exp(-delta * 7))
      cam.fov = capAngularStep(cam.fov, damped, shot.maxFovVelocity, delta)
      cam.updateProjectionMatrix()
    }

    // X-ray flash: the outer shell dissolves at the teardown entry while
    // the mechanism stays solid, then restores for the feature run.
    const ghost = st.shellGhost > 0.01
    for (const name of SHELL_MATS) {
      const mat = materials[name]
      mat.depthWrite = NO_DEPTH_WRITE.has(name) ? false : !ghost
      const base = BASE_OPACITY[name] ?? 1
      mat.opacity = ghost ? Math.max(0.02, base - st.shellGhost * 0.9) : base
    }

    // Lighting state damped per act.
    const light = STAGE_LIGHTING[act] ?? STAGE_LIGHTING.hero
    const ld = reduced ? 1 : 1 - Math.exp(-delta * 5)
    s.key += (light.key - s.key) * ld
    s.fill += (light.fill - s.fill) * ld
    s.rim += (light.rim - s.rim) * ld
    s.env += (light.env - s.env) * ld
    // Mechanism-act accent rakes the brass jaws; the x-ray act borrows it
    // to lift the exposed innards. Elsewhere it rests at zero. Focus
    // pulls borrow it briefly so the subject owns the light.
    s.accent +=
      ((act === 'mechanism' ? 1.6 : 0) +
        (act === 'xray' ? 1.2 : 0) +
        st.focusPull * 0.8 -
        s.accent) *
      ld
    s.tint.lerp(s.tintTarget.set(light.envTint), ld)
    if (refs.keyLight.current !== null) refs.keyLight.current.intensity = s.key
    if (refs.fillLight.current !== null) refs.fillLight.current.intensity = s.fill
    if (refs.rimLight.current !== null) refs.rimLight.current.intensity = s.rim
    if (refs.accentLight.current !== null) {
      refs.accentLight.current.intensity = s.accent
      refs.accentLight.current.color.copy(s.tint)
    }
    for (const name of [
      'barrel',
      'grip',
      'nose',
      'sleeve',
      'clutch',
      'ring',
      'clip',
      'cap',
    ] as const) {
      materials[name].envMapIntensity = s.env
    }
    state.gl.toneMappingExposure = t.exposure * light.exposure

    // Exploded assembly driver. Each part travels from rest to its slot in
    // the drawing (staggered, teardown/assembly.ts); the featured part lifts
    // toward the viewer, grows about its own centre, and turns once about
    // its own axis. Everything here is a pure function of progress, so a
    // reverse scrub retraces it exactly and nothing lags home at the act
    // boundary. The camera framing for the drawing is computed here too and
    // applied next frame (the layout is stable frame to frame).
    const layout = s.layout
    const inner = refs.parts.current.lead?.parent ?? null
    const cursor = st.layerCursor
    const featured = cursor > 0.02 && cursor < 9.98 ? Math.min(9, Math.floor(cursor)) : -1
    s.featureLift = 0
    if (layout !== null && inner !== null && st.stackSeparate > 0.0005) {
      inner.updateWorldMatrix(true, false)
      inner.getWorldQuaternion(s.innerQ)
      for (const layer of TEARDOWN_LAYERS) {
        const id = layer.id as AssemblyPart
        const grp = refs.parts.current[id]
        const rest = s.rest[id]
        if (grp === null || grp === undefined || rest === undefined) continue
        const e = spreadAt(p, id)
        const off = layout.offsets[id]
        const row = layout.rows[id]
        // Every part runs its own feature envelope, which is zero outside
        // its window, so nothing is cut off when the run starts or ends.
        featurePose(clamp01(cursor - layer.index), s.pose)
        const lift = s.pose.lift
        // The clip is a flat blade off the axis: it lifts and grows but
        // never orbits the pencil axis.
        const spin = id === 'clip' ? 0 : s.pose.spin
        const leading = lift > s.featureLift
        if (leading) s.featureLift = lift
        const k = 1 + (featureScale(rest.length) - 1) * lift
        const away = row === 'mechanism' ? FEATURE_LIFT.away : -FEATURE_LIFT.away
        // Target for the part's rest centre, assembly frame.
        s.partCenter.set(
          rest.center.x + off.x * e + away * lift,
          rest.center.y + off.y * e,
          rest.center.z + off.z * e + FEATURE_LIFT.toward * lift,
        )
        // Group goal: the scaled, spun rest centre lands on the target.
        // Spin is about the group's Y axis (the pencil axis), so the axial
        // coordinate is untouched and x/z turn with it.
        const c = Math.cos(spin)
        const sn = Math.sin(spin)
        s.partGoal.set(
          s.partCenter.x - (rest.center.x * c + rest.center.z * sn) * k,
          s.partCenter.y - rest.center.y * k,
          s.partCenter.z - (-rest.center.x * sn + rest.center.z * c) * k,
        )
        grp.position.copy(s.partGoal)
        grp.rotation.set(0, spin, 0)
        grp.scale.setScalar(k)
        if (leading) s.featureWorld.copy(s.partCenter)
        s.lifts[layer.index] = lift
        // Balloon anchor and stand-off direction for the HTML overlay.
        const balloon = BALLOON[id]
        const slot = calloutBridge.balloons[id]
        if (slot !== undefined) {
          slot.anchor
            .set(
              s.partCenter.x,
              s.partCenter.y + (balloon.at - 0.5) * rest.length * k,
              s.partCenter.z,
            )
            .applyMatrix4(inner.matrixWorld)
          slot.away.set(balloon.away[0], balloon.away[1], 0).applyQuaternion(s.innerQ).normalize()
        }
      }
      if (s.featureLift > 0) s.featureWorld.applyMatrix4(inner.matrixWorld)
      // Framing for the whole drawing, applied next frame on the act
      // envelope: sized from the measured layout, lifted so the drawing
      // sits above the copy and the parts list, easing toward the featured
      // part as it lifts.
      s.asmFrameW = reduced ? 0 : st.stackSeparate
      const heroScale = g?.scale.x ?? 1
      const lengthM = (layout.length + SUB_MARGIN) * heroScale
      const spanM = (layout.span + 2 * PENCIL_BARREL_R + 0.008) * heroScale
      const dist =
        assemblyDistance(lengthM, spanM, t.fov, aspect, upright) * (1 - 0.06 * s.featureLift)
      s.asmCenter
        .set((ROW_OFFSET - CLIP_LIFT) / 2, layout.centerY, 0)
        .applyMatrix4(inner.matrixWorld)
      s.asmAim.copy(s.asmCenter)
      if (s.featureLift > 0) s.asmAim.lerp(s.featureWorld, 0.12 * s.featureLift)
      const tanV = Math.tan((t.fov * Math.PI) / 360)
      s.asmAim.addScaledVector(
        s.upWorld,
        -dist * tanV * assemblyLift(upright) * (1 - 0.5 * s.featureLift),
      )
      s.camDir.copy(t.pos).sub(t.target)
      if (s.camDir.lengthSq() < 1e-9) s.camDir.set(0, 0, 1)
      s.camDir.normalize()
      s.asmCam.copy(s.asmAim).addScaledVector(s.camDir, dist)
      calloutBridge.balloonOpacity = st.calloutOpacity
      // Context recede: unfeatured parts step back slightly but stay near
      // opaque, or thin parts wash out against the paper.
      for (const layer of TEARDOWN_LAYERS) {
        const mats = RECEDE_MATS[layer.id]
        if (mats === undefined) continue
        // Unfeatured parts step back; a part comes forward with its own lift.
        const dim = 1 - 0.18 * st.contextRecede * (1 - (s.lifts[layer.index] ?? 0))
        for (const m of mats) {
          const base = BASE_OPACITY[m] ?? 1
          const shell = (SHELL_MATS as readonly string[]).includes(m)
          materials[m].opacity =
            ghost && shell ? Math.max(0.02, base - st.shellGhost * 0.9) * dim : base * dim
        }
      }
      // Feature accent on the rim light; the overlay kicker matches.
      if (featured >= 0 && refs.accentLight.current !== null) {
        s.accentTarget.set(TEARDOWN_LAYERS[featured]?.accent ?? '#ffffff')
        refs.accentLight.current.color.lerp(s.accentTarget, Math.min(1, delta * 5))
        refs.accentLight.current.intensity +=
          (1.4 - refs.accentLight.current.intensity) * Math.min(1, delta * 5)
      }
    } else {
      // Assembled: every part at rest. Materials return to rest opacity,
      // except the shell while the x-ray act dissolves it (this branch runs
      // after the dissolve is written, so it must carry it, not undo it).
      s.asmFrameW = 0
      calloutBridge.balloonOpacity = 0
      for (const layer of TEARDOWN_LAYERS) {
        for (const name of layer.shell) {
          const grp = refs.parts.current[name]
          if (grp === null || grp === undefined) continue
          grp.position.set(0, 0, 0)
          grp.rotation.set(0, 0, 0)
          grp.scale.setScalar(1)
        }
      }
      for (const mats of Object.values(RECEDE_MATS)) {
        if (mats === undefined) continue
        for (const m of mats) {
          const base = BASE_OPACITY[m] ?? 1
          const shell = (SHELL_MATS as readonly string[]).includes(m)
          materials[m].opacity = ghost && shell ? Math.max(0.02, base - st.shellGhost * 0.9) : base
        }
      }
    }

    // Mechanism reveal: the nose, grip, and divider ring dissolve with the
    // clutch macro so the brass jaws, sleeve, and lead read through the
    // shell. Runs after the park reset, which otherwise restores these.
    const mechGhost = st.cameraFocus
    if (mechGhost > 0.01) {
      for (const name of ['nose', 'grip', 'ring'] as const) {
        materials[name].opacity = Math.max(0.02, 1 - mechGhost * 0.92)
        materials[name].depthWrite = false
      }
    } else {
      for (const name of ['nose', 'grip', 'ring'] as const) {
        materials[name].depthWrite = !ghost
      }
    }
  })

  return null
}

export { setInspectPointer, clearInspectPointer }
