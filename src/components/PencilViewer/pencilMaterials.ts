import { Color, MeshPhysicalMaterial, type Texture } from 'three'
import type { PencilFinishId } from '../../data/pencil.ts'
import {
  createBarrelMaps,
  createBrushedTexture,
  createEraserTexture,
  createKnurlNormalMaps,
} from './pencilTextures.ts'

/** Every material the film director writes, keyed by pencil part. */
export interface PencilMaterialSet {
  barrel: MeshPhysicalMaterial
  grip: MeshPhysicalMaterial
  nose: MeshPhysicalMaterial
  sleeve: MeshPhysicalMaterial
  clutch: MeshPhysicalMaterial
  spring: MeshPhysicalMaterial
  shaft: MeshPhysicalMaterial
  lead: MeshPhysicalMaterial
  cap: MeshPhysicalMaterial
  clip: MeshPhysicalMaterial
  eraser: MeshPhysicalMaterial
  ring: MeshPhysicalMaterial
}

export type PencilMaterialKey = keyof PencilMaterialSet

/**
 * Finish parameters. Anodised finishes (graphite, ember) are aluminium under
 * a dielectric oxide skin: mid metalness and a thin clearcoat, so the
 * reflections stay white and the form reads even on near-black. Steel and
 * brass are bare (brass lacquered) metal. `etch` is the metal that shows
 * through the laser-etched wordmark.
 */
export interface PencilFinishParams {
  barrel: string
  cap: string
  grip: string
  ring: string
  clip: string
  etch: string
  metalness: number
  roughness: number
  clearcoat: number
}

/** Finish-reactive shell. The mechanism stays honest brass and steel. */
export const PENCIL_FINISH_PARAMS: Record<PencilFinishId, PencilFinishParams> = {
  graphite: {
    barrel: '#2a2d33',
    cap: '#2a2d33',
    grip: '#3a3e45',
    ring: '#d4d8dd',
    clip: '#c3c8ce',
    etch: '#a5abb3',
    metalness: 0.42,
    roughness: 0.36,
    clearcoat: 0.45,
  },
  steel: {
    barrel: '#b8bdc4',
    cap: '#adb2ba',
    grip: '#a2a8b0',
    ring: '#eceff3',
    clip: '#cfd4da',
    etch: '#5c6168',
    metalness: 1,
    roughness: 0.3,
    clearcoat: 0,
  },
  brass: {
    barrel: '#b48a45',
    cap: '#a98040',
    grip: '#b08744',
    ring: '#ecd29a',
    clip: '#c9a05a',
    etch: '#5e4420',
    metalness: 1,
    roughness: 0.26,
    clearcoat: 0.6,
  },
  ember: {
    barrel: '#5a3220',
    cap: '#52301e',
    grip: '#6a3e26',
    ring: '#e2b48a',
    clip: '#c3c8ce',
    etch: '#d8b08c',
    metalness: 0.5,
    roughness: 0.34,
    clearcoat: 0.45,
  },
}

function metal(
  color: string,
  roughness: number,
  extra?: Record<string, unknown>,
): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: new Color(color).convertSRGBToLinear(),
    metalness: 1,
    roughness,
    transparent: true,
    ...(extra ?? {}),
  })
}

/**
 * Builds the full pencil material set. Every material is transparent from
 * birth so the teardown dissolve never triggers a mid-film recompile.
 */
export function createPencilMaterials(
  finish: PencilFinishParams,
  detail: 'high' | 'low' = 'high',
): PencilMaterialSet {
  const knurl = createKnurlNormalMaps()
  const brushed = createBrushedTexture()
  const eraserTex = createEraserTexture()
  // Low detail (the finish fan) never gets a close-up: a quarter of the texels.
  const barrelMaps = createBarrelMaps(finish.barrel, finish.etch, detail === 'high' ? 1 : 0.5)
  const shell = {
    metalness: finish.metalness,
    clearcoat: finish.clearcoat,
    clearcoatRoughness: 0.28,
    transparent: true,
  }

  const barrel = new MeshPhysicalMaterial({
    ...shell,
    // The colour lives in the map (finish plus the etched wordmark).
    color: new Color('#ffffff'),
    map: barrelMaps.map,
    roughness: finish.roughness + 0.04,
    roughnessMap: barrelMaps.roughness,
    envMapIntensity: 1.15,
  })
  const grip = new MeshPhysicalMaterial({
    ...shell,
    color: new Color(finish.grip).convertSRGBToLinear(),
    roughness: finish.roughness + 0.12,
    roughnessMap: knurl.roughness,
    normalMap: knurl.normal,
    clearcoat: finish.clearcoat * 0.3,
    envMapIntensity: 1.1,
  })
  const nose = new MeshPhysicalMaterial({
    ...shell,
    color: new Color(finish.cap).convertSRGBToLinear(),
    roughness: finish.roughness,
    envMapIntensity: 1.15,
  })
  const sleeve = metal('#d9dce0', 0.12)
  sleeve.envMapIntensity = 1.3
  const clutch = metal('#c7a25e', 0.24, { clearcoat: 0.3, clearcoatRoughness: 0.2 })
  clutch.envMapIntensity = 1.3
  const spring = metal('#9a9fa6', 0.3)
  const shaft = metal('#8f949b', 0.42)
  shaft.envMapIntensity = 1.0
  const lead = new MeshPhysicalMaterial({
    color: new Color('#2b2b2e').convertSRGBToLinear(),
    metalness: 0.35,
    roughness: 0.55,
    transparent: true,
    envMapIntensity: 0.5,
  })
  const cap = new MeshPhysicalMaterial({
    ...shell,
    color: new Color(finish.cap).convertSRGBToLinear(),
    roughness: finish.roughness,
    roughnessMap: brushed,
    envMapIntensity: 1.25,
  })
  const clip = metal(finish.clip, 0.18)
  clip.envMapIntensity = 1.4
  const eraser = new MeshPhysicalMaterial({
    color: new Color('#d9d3c4').convertSRGBToLinear(),
    metalness: 0,
    roughness: 0.95,
    roughnessMap: eraserTex,
    transparent: true,
    envMapIntensity: 0.25,
  })
  const ring = metal(finish.ring, 0.1)
  ring.envMapIntensity = 1.7

  const set: PencilMaterialSet = {
    barrel,
    grip,
    nose,
    sleeve,
    clutch,
    spring,
    shaft,
    lead,
    cap,
    clip,
    eraser,
    ring,
  }
  for (const [name, mat] of Object.entries(set)) mat.name = `pencil:${name}`
  return set
}

/**
 * Releases a material set and every texture slot it fills. Covers each slot
 * createPencilMaterials uses (map, roughnessMap, normalMap); extend it in
 * the same change that adds a slot.
 */
export function disposePencilMaterials(set: PencilMaterialSet): void {
  const seen = new Set<string>()
  for (const material of Object.values(set)) {
    for (const slot of [
      material.map,
      material.roughnessMap,
      material.normalMap,
    ] as Array<Texture | null>) {
      // Finish-independent textures are shared by every set on the page.
      if (slot !== null && slot.userData.shared !== true && !seen.has(slot.uuid)) {
        seen.add(slot.uuid)
        slot.dispose()
      }
    }
    material.dispose()
  }
}
