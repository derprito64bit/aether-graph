import { Color } from 'three'
import type { FinishId } from '../../data/product.ts'

/** Visual parameters per finish. Colors are lerped live by the model rig. */
export interface FinishParams {
  key: FinishId
  label: string
  /** Surface family drives the material recipe, not just the colour. */
  family: 'ceramic' | 'anodised' | 'brushed' | 'glass' | 'textured'
  backColor: string
  backMetalness: number
  backRoughness: number
  backClearcoat: number
  backClearcoatRoughness: number
  /** Detail normal amplitude for grain or etch sparkle. */
  grainAmplitude: number
  islandColor: string
  frameColor: string
  frameRoughness: number
  frameAnisotropy: number
  /** Antenna band colour, finish-matched like real hardware. */
  antennaColor: string
  /** Environment tint multiplier so warm finishes read under a cool rig. */
  envTint: string
  /** Local UI accent when selected. Must clear 4.5:1 on surface (tested). */
  uiAccent: string
  /** Two-material rear panel split (Prompt A2 section 8). Only some colourways. */
  panelSplit?: boolean
  /** Smoked transparent rear over dressed internals (Prompt C section 3). */
  transparentBack?: boolean
}

/** Pre-minted colors used for per-frame finish lerping without allocation. */
export const FINISH_COLORS: Record<
  FinishId,
  { frame: Color; back: Color; island: Color; antenna: Color; accent: Color }
> = {
  obsidian: {
    frame: new Color('#7a8089'),
    back: new Color('#0d0d11'),
    island: new Color('#0f0f14'),
    antenna: new Color('#0b0c10'),
    accent: new Color('#7fb4ff'),
  },
  titanium: {
    frame: new Color('#b5bcc7'),
    back: new Color('#a9b0bc'),
    island: new Color('#b6bdc9'),
    antenna: new Color('#c2c8d2'),
    accent: new Color('#8fb8ff'),
  },
  glacier: {
    frame: new Color('#acb8cd'),
    back: new Color('#e6ecf5'),
    island: new Color('#edf2f9'),
    antenna: new Color('#9aa8c0'),
    accent: new Color('#6ea8ff'),
  },
  ember: {
    frame: new Color('#8a6a4a'),
    back: new Color('#4a2e1a'),
    island: new Color('#54341e'),
    antenna: new Color('#5c3a22'),
    accent: new Color('#ff9d5c'),
  },
  slate: {
    frame: new Color('#5a5e66'),
    back: new Color('#232529'),
    island: new Color('#2a2d33'),
    antenna: new Color('#1c1e22'),
    accent: new Color('#9fb4ff'),
  },
  clear: {
    frame: new Color('#9aa2ae'),
    back: new Color('#121722'),
    island: new Color('#1a2230'),
    antenna: new Color('#6c737e'),
    accent: new Color('#8fc2ff'),
  },
}

export const FINISH_PARAMS: Record<FinishId, FinishParams> = {
  obsidian: {
    key: 'obsidian',
    label: 'Obsidian',
    family: 'ceramic',
    backColor: '#0d0d11',
    backMetalness: 0,
    backRoughness: 0.34,
    backClearcoat: 0.7,
    backClearcoatRoughness: 0.32,
    grainAmplitude: 0.2,
    islandColor: '#0f0f14',
    frameColor: '#7a8089',
    frameRoughness: 0.3,
    frameAnisotropy: 0.55,
    antennaColor: '#0b0c10',
    envTint: '#ffffff',
    uiAccent: '#7fb4ff',
  },
  titanium: {
    key: 'titanium',
    label: 'Titanium',
    family: 'brushed',
    backColor: '#a9b0bc',
    backMetalness: 1,
    backRoughness: 0.34,
    backClearcoat: 0.1,
    backClearcoatRoughness: 0.4,
    grainAmplitude: 0.8,
    islandColor: '#b6bdc9',
    frameColor: '#b5bcc7',
    frameRoughness: 0.3,
    frameAnisotropy: 0.7,
    antennaColor: '#c2c8d2',
    envTint: '#ffffff',
    uiAccent: '#8fb8ff',
  },
  glacier: {
    key: 'glacier',
    label: 'Glacier',
    family: 'glass',
    backColor: '#e6ecf5',
    backMetalness: 0,
    backRoughness: 0.32,
    backClearcoat: 1,
    backClearcoatRoughness: 0.08,
    grainAmplitude: 0.5,
    islandColor: '#edf2f9',
    frameColor: '#acb8cd',
    frameRoughness: 0.3,
    frameAnisotropy: 0.45,
    antennaColor: '#9aa8c0',
    envTint: '#f2f6ff',
    uiAccent: '#6ea8ff',
  },
  ember: {
    key: 'ember',
    label: 'Ember',
    family: 'anodised',
    backColor: '#4a2e1a',
    backMetalness: 0.6,
    backRoughness: 0.42,
    backClearcoat: 0,
    backClearcoatRoughness: 0.5,
    grainAmplitude: 0.35,
    islandColor: '#54341e',
    frameColor: '#8a6a4a',
    frameRoughness: 0.32,
    frameAnisotropy: 0.6,
    antennaColor: '#5c3a22',
    envTint: '#ffd9b8',
    uiAccent: '#ff9d5c',
    panelSplit: true,
  },
  slate: {
    key: 'slate',
    label: 'Slate',
    family: 'textured',
    backColor: '#232529',
    backMetalness: 0.2,
    backRoughness: 0.55,
    backClearcoat: 0.05,
    backClearcoatRoughness: 0.6,
    grainAmplitude: 1,
    islandColor: '#2a2d33',
    frameColor: '#5a5e66',
    frameRoughness: 0.38,
    frameAnisotropy: 0.5,
    antennaColor: '#1c1e22',
    envTint: '#ffffff',
    uiAccent: '#9fb4ff',
    panelSplit: true,
  },
  clear: {
    key: 'clear',
    label: 'Clear',
    family: 'glass',
    backColor: '#121722',
    backMetalness: 0,
    backRoughness: 0.06,
    backClearcoat: 1,
    backClearcoatRoughness: 0.06,
    grainAmplitude: 0.15,
    islandColor: '#1a2230',
    frameColor: '#9aa2ae',
    frameRoughness: 0.3,
    frameAnisotropy: 0.5,
    antennaColor: '#6c737e',
    envTint: '#eef4ff',
    uiAccent: '#8fc2ff',
    transparentBack: true,
  },
}
