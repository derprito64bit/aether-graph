import { useFrame } from '@react-three/fiber'
import type { MotionValue } from 'motion/react'
import { useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { PencilPartId } from '../components/PencilViewer/pencilDimensions.ts'
import type { PencilMaterialSet } from '../components/PencilViewer/pencilMaterials.ts'
import { centerBias, fitFov, macroFloorFov } from './framing.ts'
import { SHOTS, capAngularStep } from './shots.ts'
import { STAGE_LIGHTING } from './lighting.ts'
import { clearInspectPointer, setInspectPointer } from './inspect.ts'
import { computeFilmStates, layerWindow } from './states.ts'
import { calloutBridge } from './overlay/callouts.ts'
import { actAt } from './timeline.ts'
import {
  FEATURE_OFFSET,
  FLIP,
  LAYER_GAP,
  LAYER_GAP_COMPACT,
  TEARDOWN_LAYERS,
  featureFrame,
  layerOffset,
  weightDamp,
  type FeatureFrame,
} from './teardown/layers.ts'
import { sampleFilm } from './sample.ts'
import { dollyZoomFov } from '../zoom/zoom.ts'

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

export interface FilmRefs {
  hero: MutableRefObject<THREE.Group | null>
  parts: MutableRefObject<Record<PencilPartId, THREE.Group | null>>
  keyLight: MutableRefObject<THREE.DirectionalLight | null>
  fillLight: MutableRefObject<THREE.DirectionalLight | null>
  rimLight: MutableRefObject<THREE.DirectionalLight | null>
  accentLight: MutableRefObject<THREE.DirectionalLight | null>
  parallaxX: MotionValue<number>
  parallaxY: MotionValue<number>
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
    teardown: { detach: 0, turn: 0, scale: 0 } as FeatureFrame,
    feature: { detach: 0, turn: 0, scale: 0 } as FeatureFrame,
    focus: new THREE.Vector3(),
    focusHalfM: 0.01,
    pushW: 0,
    aimGoal: new THREE.Vector3(),
    showV: new THREE.Vector3(),
    rightV: new THREE.Vector3(),
    upV: new THREE.Vector3(),
    camGoal: new THREE.Vector3(),
    camDir: new THREE.Vector3(),
    axisV: new THREE.Vector3(),
    heroQ: new THREE.Quaternion(),
    prepared: false,
  })

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
    if (!reduced && st.stackSeparate > 0.001) {
      const cursor = st.layerCursor
      const fi = cursor > 0.02 && cursor < 9.99 ? Math.min(9, Math.floor(cursor)) : -1
      const fl = fi >= 0 ? TEARDOWN_LAYERS[fi] : undefined
      const first = fl?.shell[0]
      const anchor = first === undefined ? undefined : calloutBridge.anchors[first]?.[0]
      if (fl !== undefined && anchor !== null && anchor !== undefined) {
        featureFrame(clamp01(cursor - fl.index), fl.weight, s.feature, false)
        anchor.getWorldPosition(s.focus)
        s.focusHalfM = fl.featureHalfM
        focusPush = s.feature.detach
      }
    }
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
      if (act === 'exploded') {
        s.rightV.setFromMatrixColumn(cam.matrixWorld, 0)
        s.upV.setFromMatrixColumn(cam.matrixWorld, 1)
        const dist = Math.max(0.05, s.camPos.distanceTo(s.focus))
        const tanV = Math.max(0.05, Math.tan(((cam.fov * Math.PI) / 180) / 2))
        const narrow = state.size.width < 700
        // Showcase spot: center-right and slightly low on desktop so the
        // part clears both the left stack and the right text column;
        // upper third on mobile above the bottom copy sheet.
        const ox = narrow ? 0 : 0.05
        const oy = narrow ? 0.3 : -0.18
        s.showV
          .copy(s.focus)
          .addScaledVector(s.rightV, -ox * dist * tanV * aspect)
          .addScaledVector(s.upV, -oy * dist * tanV)
        const w = Math.min(1, Math.max(0, focusPush))
        s.aimGoal.copy(t.target).lerp(s.showV, w * w * (3 - 2 * w))
      } else {
        s.aimGoal.lerp(s.focus, Math.min(aimShare, aimShare * focusPush))
      }
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
    // Spotlight staging: while the exploded diagram (or its x-ray hold)
    // is up, the whole pencil slides left so the right column is free
    // for the showcase panel. Other acts keep their authored framing:
    // the shift would otherwise drag the macro aim off its subject.
    // Narrow screens shift less so the stack never clips the bezel.
    const inShowcase = act === 'exploded' || act === 'xray'
    const shiftAmt = state.size.width < 900 ? -0.04 : -0.08
    const shiftEnv = inShowcase ? Math.min(1, Math.max(0, st.stackSeparate * 1.5)) : 0
    const stageShift = shiftAmt * shiftEnv
    // ...and settles slightly so the crown never tucks behind the navbar.
    const stageDrop = -0.015 * shiftEnv
    if (g !== null) {
      if (reduced) {
        g.rotation.set(t.rx, t.ry, t.rz)
        g.scale.setScalar(t.scale)
        g.position.set(px + stageShift, py + stageDrop, 0)
      } else {
        // Damped toward the sampled pose, then capped: a hard flick gets a
        // fast controlled move, never a whip.
        g.rotation.x = capRot(g.rotation.x, g.rotation.x + (t.rx - g.rotation.x) * damp)
        g.rotation.y = capRot(g.rotation.y, g.rotation.y + (t.ry - g.rotation.y) * damp)
        g.rotation.z = capRot(g.rotation.z, g.rotation.z + (t.rz - g.rotation.z) * damp)
        const ns = t.scale
        g.scale.x += (ns - g.scale.x) * damp
        g.scale.y += (ns - g.scale.y) * damp
        g.scale.z += (ns - g.scale.z) * damp
        g.position.x += (px + stageShift - g.position.x) * damp
        g.position.y += (py + stageDrop - g.position.y) * damp
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
    if (s.pushW > 0.001) {
      const bx = Math.min(1, Math.max(0, (s.pushW - 0.4) / 0.2))
      const be = bx * bx * (3 - 2 * bx)
      targetFov += (t.fov - targetFov) * be
    }
    if (aspect < 0.8) {
      const floor = macroFloorFov(p, distance, aspect)
      if (floor > targetFov) targetFov = floor
    }
    // Vertigo once, on the shaft feature: widen the lens while the camera
    // pushes in so the shaft holds size and the background warps. Used
    // once; twice would be a gimmick. Derived from the layer cursor, not
    // raw progress, so the beat tracks layer 5.
    if (!reduced) {
      const w = layerWindow(st.layerCursor, 5, 0.5, 0.5)
      if (w > 0) {
        targetFov += (dollyZoomFov(targetFov, w * 0.12, distance) - targetFov) * w
      }
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

    // Teardown layer driver: part groups ride their axial slots plus the
    // four-phase feature gesture, damped by weight class. Separation runs
    // along the pencil axis (hero-local Y); the feature lift rides X/Z.
    const gap = state.size.width < 900 ? LAYER_GAP_COMPACT : LAYER_GAP
    const teardownSep = st.stackSeparate
    if (teardownSep > 0.001) {
      const cursor = st.layerCursor
      const featured = cursor > 0.02 && cursor < 9.99 ? Math.min(9, Math.floor(cursor)) : -1
      for (const layer of TEARDOWN_LAYERS) {
        featureFrame(clamp01(cursor - layer.index), layer.weight, s.teardown, reduced)
        const f = s.teardown
        const off = layerOffset(layer.index, 10, gap, teardownSep)
        const damp = reduced ? 1 : 1 - Math.exp(-delta * weightDamp(layer.weight))
        for (const name of layer.shell) {
          const grp = refs.parts.current[name]
          if (grp === null || grp === undefined) continue
          grp.position.y += (off + FEATURE_OFFSET.y * f.detach - grp.position.y) * damp
          grp.position.z += (FEATURE_OFFSET.z * f.detach - grp.position.z) * damp
          // Presentation yaw for the flat clip only: everything else holds
          // orientation. Turns the blade face to the camera for its solo.
          const yaw = layer.id === 'clip' && layer.index === featured ? 0.6 * f.detach : 0
          grp.rotation.set(FLIP.x * f.turn, yaw, FLIP.z * f.turn)
          // Compact viewports shrink the hero bump so the layer never crops.
          const bump = (layer.featureScale - 1) * f.scale * (gap < 0.006 ? 0.85 : 1)
          // Spotlight showcase: the featured part steps right and scales
          // up for its solo, blended on the same detach envelope so it
          // travels out and home with the beat. Small parts scale more.
          // Both ride inside the damped goals: nothing accumulates.
          let spotX = 0
          let spotS = 1
          if (layer.index === featured) {
            // Small parts scale up for legibility; flat blades like the
            // clip need extra presence to read edge-on. Long parts stay
            // near unity so they keep framing the stack.
            let solo = Math.min(3.5, Math.max(1.2, 0.016 / Math.max(0.001, layer.featureHalfM)))
            if (layer.id === 'clip') solo = Math.max(solo, 1.6)
            spotX = 0.045 * f.detach
            spotS = 1 + (solo - 1) * f.detach
          }
          grp.position.x += (FEATURE_OFFSET.x * f.detach + spotX - grp.position.x) * damp
          grp.scale.setScalar((1 + bump) * spotS)
        }
      }
      // Context recede over the ghost dissolve; featured keeps rest opacity.
      // Gentle on a light stage: unfeatured layers step back slightly but
      // stay near-opaque, or thin parts wash out against the cream. The
      // inner mechanism never joins the ghost: during the x-ray hold the
      // shell dissolves precisely so the innards stay solid.
      for (const layer of TEARDOWN_LAYERS) {
        const mats = RECEDE_MATS[layer.id]
        if (mats === undefined) continue
        const dim = layer.index === featured ? 1 : 1 - 0.15 * st.contextRecede
        for (const m of mats) {
          const base = BASE_OPACITY[m] ?? 1
          const shell = (SHELL_MATS as readonly string[]).includes(m)
          materials[m].opacity = ghost && shell ? Math.max(0.02, base - st.shellGhost * 0.9) * dim : base * dim
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
      // Parked exactly: no legacy writer owns the parts, and every layer
      // material returns to rest opacity after the recede.
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
          materials[m].opacity = BASE_OPACITY[m] ?? 1
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
