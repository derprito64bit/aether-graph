import { Color, MeshPhysicalMaterial } from 'three'
import type { PencilFinishId } from '../../data/pencil.ts'
import { PENCIL_FINISHES } from '../../data/pencil.ts'
import { createBrushedTexture, createEraserTexture, createKnurlMaps } from './pencilTextures.ts'

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

export interface PencilFinishParams {
  barrel: string
  cap: string
  grip: string
  ring: string
  clip: string
  uiAccent: string
}

function accentOf(id: PencilFinishId): string {
  return PENCIL_FINISHES.find((f) => f.id === id)?.accent ?? '#c9a06a'
}

/** Finish-reactive metal colours. The mechanism stays honest brass and steel. */
export const PENCIL_FINISH_PARAMS: Record<PencilFinishId, PencilFinishParams> = {
  graphite: {
    barrel: '#41454d',
    cap: '#3d4149',
    grip: '#565b64',
    ring: '#c8ccd2',
    clip: '#4a4e55',
    uiAccent: accentOf('graphite'),
  },
  steel: {
    barrel: '#9aa0a8',
    cap: '#8b9098',
    grip: '#7e848d',
    ring: '#e8ebef',
    clip: '#a8adb5',
    uiAccent: accentOf('steel'),
  },
  brass: {
    barrel: '#8a6a34',
    cap: '#7a5c2c',
    grip: '#96742f',
    ring: '#e6c886',
    clip: '#8a6a34',
    uiAccent: accentOf('brass'),
  },
  ember: {
    barrel: '#4a2c17',
    cap: '#402512',
    grip: '#5a3a20',
    ring: '#d8a878',
    clip: '#4a2c17',
    uiAccent: accentOf('ember'),
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
export function createPencilMaterials(finish: PencilFinishParams): PencilMaterialSet {
  const knurl = createKnurlMaps()
  const brushed = createBrushedTexture()
  const eraserTex = createEraserTexture()

  const barrel = new MeshPhysicalMaterial({
    color: new Color(finish.barrel).convertSRGBToLinear(),
    // Anodised aluminium carries a dielectric oxide skin: mid metalness
    // keeps the reflection structure while directionals still model form.
    metalness: 0.45,
    roughness: 0.42,
    roughnessMap: brushed,
    transparent: true,
    envMapIntensity: 1.5,
  })
  const grip = new MeshPhysicalMaterial({
    color: new Color(finish.grip).convertSRGBToLinear(),
    metalness: 1,
    roughness: 0.46,
    bumpMap: knurl.bump,
    bumpScale: 0.6,
    roughnessMap: knurl.roughness,
    transparent: true,
    envMapIntensity: 1.3,
  })
  const nose = metal('#1b1b1e', 0.42)
  nose.envMapIntensity = 1.1
  const sleeve = metal('#d5d8dc', 0.16)
  sleeve.envMapIntensity = 1.5
  const clutch = metal('#c09a58', 0.3)
  clutch.envMapIntensity = 1.4
  const spring = metal('#6a6e75', 0.35)
  const shaft = metal('#878c93', 0.5)
  shaft.envMapIntensity = 0.9
  const lead = new MeshPhysicalMaterial({
    color: new Color('#2b2b2e').convertSRGBToLinear(),
    metalness: 0.35,
    roughness: 0.55,
    transparent: true,
    envMapIntensity: 0.5,
  })
  const cap = new MeshPhysicalMaterial({
    color: new Color(finish.cap).convertSRGBToLinear(),
    metalness: 0.6,
    roughness: 0.34,
    roughnessMap: brushed,
    transparent: true,
    envMapIntensity: 1.4,
  })
  const clip = metal(finish.clip, 0.3)
  clip.envMapIntensity = 1.3
  const eraser = new MeshPhysicalMaterial({
    color: new Color('#e6e1d4').convertSRGBToLinear(),
    metalness: 0,
    roughness: 0.95,
    roughnessMap: eraserTex,
    transparent: true,
    envMapIntensity: 0.25,
  })
  const ring = metal(finish.ring, 0.15)
  ring.envMapIntensity = 1.6

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
