import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { CameraAssembly } from './CameraAssembly.tsx'
import { usePhoneConfig, type FocusLensId } from './PhoneConfig.tsx'
import {
  BACK_FACE,
  BACK_PANEL,
  BEZEL,
  CHAMFER,
  DIM,
  DISPLAY_INSET,
  DISPLAY_PANEL,
  FRONT_GLASS,
  PANEL_SPLIT,
  SY,
} from './phoneDimensions.ts'
import {
  assignRailGroups,
  bodyExponent,
  createBezelGeometry,
  createFrameBodyGeometry,
  createFrameRingGeometry,
  superellipseSlabGeometry,
} from './phoneGeometry.ts'
import {
  FINISH_COLORS,
  FINISH_PARAMS,
  RAIL_KEYS,
  createPhoneMaterials,
  type PhoneMaterialSet,
} from './phoneMaterials.ts'
import { EdgeDetails, FrontGlassDetails } from './PhoneDetails.tsx'

interface PhoneModelProps {
  /** Optional per-instance material set (the film passes its own for x-ray). */
  materials?: PhoneMaterialSet
  /** Optional shell sub-groups so a director can part the layers. */
  groups?: Partial<
    Record<'frame' | 'back' | 'glass' | 'display' | 'module', MutableRefObject<THREE.Group | null>>
  >
  /** Animated focus ring on the active lens. The film disables this. */
  animateFocusRing?: boolean
  /**
   * Low drops knurling, the second baffle, ToF internals, the port tongue
   * contacts, and the regulatory text, and halves outline sampling.
   */
  detail?: 'high' | 'low'
  /**
   * Film-only optical separation refs. Keys are `${lens}:${layer}` with
   * layers cover, collar, barrel, element, sensor, plus `knurl`. The film
   * director writes staged offsets; viewers leave them at rest.
   */
  opticsSeparation?: MutableRefObject<Record<string, THREE.Group | null>>
}

const LENSES: Array<{ key: FocusLensId }> = [
  { key: 'main' },
  { key: 'ultra' },
  { key: 'mid' },
  { key: 'periscope' },
]

/** Procedurally built, finish-reactive phone model. Pure geometry and materials. */
export function PhoneModel({
  materials,
  groups,
  animateFocusRing = true,
  detail = 'high',
  opticsSeparation,
}: PhoneModelProps) {
  const ownMaterials = useMemo(
    () => (materials ? null : createPhoneMaterials(FINISH_PARAMS.obsidian)),
    [materials],
  )
  const set = materials ?? ownMaterials
  if (set === null) return null

  return (
    <PhoneModelInner
      set={set}
      groups={groups}
      animateFocusRing={animateFocusRing}
      detail={detail}
      opticsSeparation={opticsSeparation}
    />
  )
}

function PhoneModelInner({
  set,
  groups,
  animateFocusRing,
  detail,
  opticsSeparation,
}: {
  set: PhoneMaterialSet
  groups: PhoneModelProps['groups']
  animateFocusRing: boolean
  detail: 'high' | 'low'
  opticsSeparation: PhoneModelProps['opticsSeparation']
}) {
  const { finish, focusLens } = usePhoneConfig()
  const smooth = useRef({
    frameColor: FINISH_COLORS.obsidian.frame.clone(),
    backColor: FINISH_COLORS.obsidian.back.clone(),
    islandColor: FINISH_COLORS.obsidian.island.clone(),
    antennaColor: FINISH_COLORS.obsidian.antenna.clone(),
    accentColor: FINISH_COLORS.obsidian.accent.clone(),
    backMetal: FINISH_PARAMS.obsidian.backMetalness,
    backRough: FINISH_PARAMS.obsidian.backRoughness,
    backClear: FINISH_PARAMS.obsidian.backClearcoat,
    frameRough: FINISH_PARAMS.obsidian.frameRoughness,
    frameAniso: FINISH_PARAMS.obsidian.frameAnisotropy,
  })

  const frameBodyGeometry = useMemo(() => {
    const geometry = createFrameBodyGeometry(BACK_FACE, detail === 'low')
    assignRailGroups(geometry)
    return geometry
  }, [detail])
  const frameRingGeometry = useMemo(() => {
    const geometry = createFrameRingGeometry(detail === 'low')
    assignRailGroups(geometry)
    return geometry
  }, [detail])
  const backSlabGeometry = useMemo(
    () => superellipseSlabGeometry(0.03695, 0.07835, bodyExponent(), BACK_PANEL.depth, 0.0013),
    [],
  )
  const glassSlabGeometry = useMemo(
    // Corner radius matches the frame-ring opening (0.0012): matched
    // corners, no slivers or overlaps at the glass meet.
    () =>
      superellipseSlabGeometry(0.0376, 0.079, bodyExponent(), FRONT_GLASS.depth, CHAMFER.glassMeet),
    [],
  )
  const displaySlabGeometry = useMemo(
    () => superellipseSlabGeometry(0.036, 0.0774, bodyExponent(), DISPLAY_PANEL.depth, 0.0001),
    [],
  )
  // Bezel ink ring: glass footprint outside, active area inside, feathered
  // edge. Corner loops share the body exponent so the ink band is uniform.
  // Renders under the glass slab so the specular passes over unbroken.
  const bezelGeometry = useMemo(
    () => createBezelGeometry(0.0376, 0.079, 0.036, 0.0774, bodyExponent()),
    [],
  )
  const lensRefs = useRef<Partial<Record<FocusLensId, THREE.Group>>>({})
  const focusRef = useRef<{ key: FocusLensId | null; blend: number }>({ key: focusLens, blend: 0 })
  // Rail materials in group order (+X, -X, +Y, -Y) for the split extrusion.
  const rails = useMemo(
    () => RAIL_KEYS.map((name) => set[name]) as unknown as THREE.Material[],
    [set],
  )

  // Writes into three.js objects per frame without React state. This is the
  // sanctioned R3F hot path: scratch-owned colors, zero allocation.
  // oxlint-disable-next-line react/immutability
  useFrame((state, delta) => {
    const targetColors = FINISH_COLORS[finish]
    const targetParams = FINISH_PARAMS[finish]
    const k = 1 - Math.exp(-delta * 5.5)
    const s = smooth.current
    s.frameColor.lerp(targetColors.frame, k)
    s.backColor.lerp(targetColors.back, k)
    s.islandColor.lerp(targetColors.island, k)
    s.antennaColor.lerp(targetColors.antenna, k)
    s.accentColor.lerp(targetColors.accent, k)
    s.backMetal += (targetParams.backMetalness - s.backMetal) * k
    s.backRough += (targetParams.backRoughness - s.backRough) * k
    s.backClear += (targetParams.backClearcoat - s.backClear) * k
    s.frameRough += (targetParams.frameRoughness - s.frameRough) * k
    s.frameAniso += (targetParams.frameAnisotropy - s.frameAniso) * k

    for (const name of RAIL_KEYS) {
      set[name].color.copy(s.frameColor)
      set[name].roughness = s.frameRough
      set[name].anisotropy = s.frameAniso
    }
    set.frameChamfer.color.copy(s.frameColor)
    set.frameChamfer.roughness = s.frameRough * 0.6
    set.frameChamfer.anisotropy = s.frameAniso
    set.back.color.copy(s.backColor)
    set.back.metalness = s.backMetal
    set.back.roughness = s.backRough
    set.back.clearcoat = s.backClear
    set.island.color.copy(s.islandColor)
    set.antenna.color.copy(s.antennaColor)
    set.focusRing.color.copy(s.accentColor)
    set.focusRing.emissive.copy(s.accentColor)

    // Subpixel hint: RGB stripes fade in only below ~12cm, where they stop
    // aliasing and start reading as a real panel. Zero at normal distance.
    if (detail === 'high') {
      const dist = state.camera.position.length()
      const w = Math.min(1, Math.max(0, (0.12 - dist) / 0.03))
      set.subpixel.opacity += (w * 0.16 - set.subpixel.opacity) * Math.min(1, delta * 8)
    } else {
      set.subpixel.opacity = 0
    }

    const focus = focusRef.current
    if (focus.key !== focusLens) {
      focus.key = focusLens
      focus.blend = 0
    }
    focus.blend = Math.min(1, focus.blend + delta * 6)
    const t = state.clock.elapsedTime
    for (const lens of LENSES) {
      const group = lensRefs.current[lens.key]
      if (!group) continue
      const active = focus.key === lens.key
      const pulse = active ? Math.sin(t * 2.4) * 0.004 : 0
      const scale = 1 + ((active ? 1.04 : 1) - 1) * focus.blend + pulse
      group.scale.setScalar(scale)
      const ring = group.children.find((child) => child.name === 'focus-ring') as
        THREE.Mesh | undefined
      if (ring !== undefined && animateFocusRing) {
        const targetOpacity = active ? 0.55 + Math.sin(t * 3) * 0.12 : 0
        set.focusRing.opacity += (targetOpacity - set.focusRing.opacity) * 0.12
      }
    }
  })

  return (
    <group>
      <group ref={groups?.frame}>
        <mesh geometry={frameBodyGeometry} material={rails} castShadow />
        <mesh geometry={frameRingGeometry} material={rails} castShadow />
        <EdgeDetails set={set} detail={detail} />
      </group>
      <group ref={groups?.back}>
        <mesh geometry={backSlabGeometry} position={[0, 0, BACK_PANEL.z]}>
          <primitive object={set.back} attach="material" />
        </mesh>
        <group ref={groups?.module}>
          <CameraAssembly
            materials={set}
            lensRefs={lensRefs}
            detail={detail}
            separation={opticsSeparation}
          />
        </group>
        {/* Two-material rear panel (Prompt A2 section 8): recessed groove
            plus a proud textured lower panel. Per finish, not global. */}
        {FINISH_PARAMS[finish].panelSplit === true ? (
          <group>
            <mesh position={[0, PANEL_SPLIT.seamY, BACK_FACE + 0.00005]}>
              <boxGeometry args={[DIM.w - 0.004, PANEL_SPLIT.seamWidth, 0.0003]} />
              <primitive object={set.panelSeam} attach="material" />
            </mesh>
            <mesh position={[0, (PANEL_SPLIT.seamY - SY + 0.002) / 2 - 0.0001, BACK_FACE]}>
              <boxGeometry args={[DIM.w - 0.004, -SY + 0.002 - PANEL_SPLIT.seamY, 0.00024]} />
              <primitive object={set.panelLower} attach="material" />
            </mesh>
          </group>
        ) : null}
        <mesh
          position={[
            0,
            -0.065,
            BACK_FACE - (FINISH_PARAMS[finish].panelSplit === true ? 0.00018 : 0.00006),
          ]}
          rotation={[0, Math.PI, 0]}
        >
          <planeGeometry args={[0.016, 0.004]} />
          <primitive object={set.logo} attach="material" />
        </mesh>
        {detail === 'high' ? (
          <mesh position={[0.018, -0.068, BACK_FACE - 0.00006]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.012, 0.0022]} />
            <primitive object={set.regulatory} attach="material" />
          </mesh>
        ) : null}
        {/* 0.12mm frame-to-back gap: recessed dark hairlines top and bottom */}
        <mesh position={[0, SY - 0.0006, BACK_FACE + 0.0002]}>
          <boxGeometry args={[DIM.w - 0.004, 0.00012, 0.0002]} />
          <primitive object={set.antenna} attach="material" />
        </mesh>
        <mesh position={[0, -SY + 0.0006, BACK_FACE + 0.0002]}>
          <boxGeometry args={[DIM.w - 0.004, 0.00012, 0.0002]} />
          <primitive object={set.antenna} attach="material" />
        </mesh>
      </group>
      <group ref={groups?.glass}>
        <mesh geometry={glassSlabGeometry} position={[0, 0, FRONT_GLASS.z]}>
          <primitive object={set.screen} attach="material" />
        </mesh>
        <FrontGlassDetails set={set} />
      </group>
      <group ref={groups?.display}>
        <mesh geometry={bezelGeometry}>
          <primitive object={set.bezel} attach="material" />
        </mesh>
        <mesh geometry={displaySlabGeometry} position={[0, 0, DISPLAY_PANEL.z]}>
          <primitive object={set.display} attach="material" />
        </mesh>
        {detail === 'high' ? (
          <mesh position={[0, 0, FRONT_GLASS.z + FRONT_GLASS.depth / 2 + 0.00001]} renderOrder={2}>
            <planeGeometry
              args={[DIM.w - BEZEL * 2 - DISPLAY_INSET * 2, DIM.h - BEZEL * 2 - DISPLAY_INSET * 2]}
            />
            <primitive object={set.subpixel} attach="material" />
          </mesh>
        ) : null}
      </group>
    </group>
  )
}
