import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { INTERNALS_KEYS, type InternalsMaterialSet } from './internalsMaterials.ts'
import { EXPLODE_DIRECTIONS, EXPLODE_PARTS, partProgress } from './explode.ts'
import {
  FLIP,
  FEATURE_OFFSET,
  PART_LAYER,
  TEARDOWN_LAYERS,
  featureFrame,
  layerOffset,
  weightDamp,
  type FeatureFrame,
} from '../teardown/layers.ts'
import { calloutBridge } from '../overlay/callouts.ts'
import { BoardPart } from './parts/board.tsx'
import { OpticsPart } from './parts/optics.tsx'
import { PowerPart } from './parts/power.tsx'
import type { PartRegister } from './parts/register.ts'
import { SiliconPart } from './parts/silicon.tsx'

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** Mutable per-frame control plane. Written by the director, read here. No React renders. */
export interface InternalsControl {
  opacity: number
  explode: number
  explodeBatt: number
  explodeRadial: number
  chipFocus: number
  chipLift: number
  battLift: number
  subjectDim: number
  energy: number
  /** Shield lids lifted on their own window, revealing components. */
  shieldLift: number
  /** Coil LED ring brightness for the Clear finish. */
  coilRing: number
  /** Teardown stack separation 0..1 (Prompt D). Overrides explode vectors. */
  stackSeparate: number
  /** Teardown continuous layer cursor 0..10 (Prompt D). */
  layerCursor: number
  /** Teardown layer gap in meters (compact on narrow viewports). */
  teardownGap: number
  /** Reduced motion: envelopes snap binary instead of travelling. */
  reducedMotion: boolean
}

interface InternalsProps {
  materials: InternalsMaterialSet
  control: MutableRefObject<InternalsControl>
}

/**
 * X-ray hardware stack. Every part rides the Prompt C choreography: removal
 * order dominates, radial distance breaks ties, per-layer radial blends keep
 * flat sheets lifting straight while screws fan outward spinning. Tumble
 * turns parts toward the viewer as they lift; shields lift on their own
 * window for the reveal beat. Everything is a pure function of the explode
 * scalar, so the reverse scrub retraces exactly: screw spin is explode x 2PI,
 * never an accumulating angle.
 */
export function Internals({ materials, control }: InternalsProps) {
  const groups = useRef<Record<string, THREE.Group[]>>({})
  const scratch = useRef({ dir: new THREE.Vector3() })
  const feat = useRef<FeatureFrame>({ detach: 0, turn: 0, scale: 0 })
  const register: PartRegister = useMemo(() => {
    const map: Record<string, THREE.Group[]> = {}
    groups.current = map
    return (id: string) => (g: THREE.Group | null) => {
      if (g === null) {
        delete map[id]
        return
      }
      map[id] = [...(map[id] ?? []), g]
    }
  }, [])

  useFrame((_, delta) => {
    const c = control.current
    for (const k of INTERNALS_KEYS) materials[k].opacity = c.opacity
    // Decals stay subordinate: marking low contrast, floorplan a whisper.
    materials.dieMark.opacity = c.opacity * 0.9
    materials.dieFloor.opacity = c.opacity * 0.25
    const visible = c.opacity > 0.01
    // Publish anchors for the HTML callout layer (one ref copy per frame).
    calloutBridge.anchors = groups.current
    const sep = c.stackSeparate
    const teardown = sep > 0.001
    for (const part of EXPLODE_PARTS) {
      const targets = groups.current[part.id]
      if (targets === undefined) continue
      // Spin is explode-driven in both modes so screws never unwind.
      const wSpin = partProgress(c.explode, part.delay)
      const w = wSpin * (1 - sep)
      const base = EXPLODE_DIRECTIONS[part.id] ?? scratch.current.dir.set(0, 0, -1)
      const dir = scratch.current.dir.copy(base)
      const travel = part.distance * w
      const layerIndex = PART_LAYER[part.id] ?? 5
      const layer = TEARDOWN_LAYERS[layerIndex]
      const weight = layer?.weight ?? 'medium'
      if (teardown)
        featureFrame(clamp01(c.layerCursor - layerIndex), weight, feat.current, c.reducedMotion)
      const f = feat.current
      const off = layerOffset(layerIndex, 10, c.teardownGap, sep)
      const damp = teardown && !c.reducedMotion ? 1 - Math.exp(-delta * weightDamp(weight)) : 1
      for (const g of targets) {
        g.visible = visible
        if (teardown) {
          // Layer slot plus the feature gesture; damped by weight class so
          // mass reads from motion alone. Goals converge, so rest is exact.
          g.position.x += (FEATURE_OFFSET.x * f.detach - g.position.x) * damp
          g.position.y += (FEATURE_OFFSET.y * f.detach - g.position.y) * damp
          g.position.z += (off + FEATURE_OFFSET.z * f.detach - g.position.z) * damp
          g.rotation.set(FLIP.x * f.turn, FLIP.y * f.turn, FLIP.z * f.turn)
          const bump =
            ((layer?.featureScale ?? 1) - 1) * f.scale * (c.teardownGap < 0.008 ? 0.85 : 1)
          g.scale.setScalar(1 + bump)
          if (part.spin === true) g.rotation.z = wSpin * Math.PI * 2
        } else {
          g.position.set(dir.x * travel, dir.y * travel, dir.z * travel)
          g.scale.setScalar(1)
          if (part.tumble !== undefined) {
            g.rotation.set(part.tumble[0] * w, part.tumble[1] * w, part.tumble[2] * w)
          } else if (!part.spin) {
            g.rotation.set(0, 0, 0)
          }
          if (part.spin === true) {
            g.rotation.z = wSpin * Math.PI * 2
          }
        }
      }
    }
    if (!visible) return

    // Shield lids lift on their own window after the outer layers clear.
    const lidW = Math.min(1, Math.max(0, c.shieldLift))
    for (const g of groups.current['shield-lid'] ?? []) {
      g.position.z -= lidW * 0.005
      g.rotation.x += lidW * 0.25
    }

    // Act-specific lifts ride on top of the registry explode. The die lifts
    // rearward (toward the back viewer), revealing balls and substrate.
    const bump = (ids: string[], dz: number): void => {
      for (const id of ids) {
        for (const g of groups.current[id] ?? []) g.position.z += dz
      }
    }
    bump(['die'], -c.chipLift * 0.004)
    bump(['cell', 'cell-wrap'], c.explodeBatt * 0.003 + c.battLift * 0.003)
    bump(['charge-coil'], c.explodeBatt * 0.0044)

    // Subject dim: surroundings step back while the die or cell owns the frame.
    const dim = 1 - c.subjectDim * 0.55
    materials.board.opacity = c.opacity * dim
    materials.shield.opacity = c.opacity * dim
    materials.housing.opacity = c.opacity * (c.chipFocus > 0.4 ? dim : 1)
    // Featured-layer pop: unique-material parts glow while featured
    // (silicon die, battery band). Shared-material layers pop via position,
    // scale, and the rim accent instead.
    const featured =
      sep > 0.001 && c.layerCursor > 0.02 && c.layerCursor < 9.99
        ? Math.min(9, Math.floor(c.layerCursor))
        : -1
    materials.die.emissiveIntensity = 0.7 + c.chipFocus * 1.6 + (featured === 5 ? 1.5 : 0)
    materials.cellGlow.opacity = c.opacity
    // Capped at 2.5: the authored 4.9 clipped against the 1.1 battery
    // exposure and bloomed like a video game (Prompt B section 5.3).
    materials.cellGlow.emissiveIntensity =
      1 + c.energy * 1 + c.battLift * 0.5 + (featured === 3 ? 1 : 0)
    // Coil status ring: charging indicator for the Clear finish.
    materials.coilRing.emissiveIntensity = 0.25 + c.coilRing * 2.4
  })

  return (
    <group>
      <BoardPart materials={materials} register={register} />
      <SiliconPart materials={materials} register={register} />
      <PowerPart materials={materials} register={register} />
      <OpticsPart materials={materials} register={register} />
    </group>
  )
}
