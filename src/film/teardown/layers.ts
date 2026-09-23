import type { PencilPartId } from '../../components/PencilViewer/pencilDimensions.ts'

/**
 * Teardown layer manifest for the Aether Graph 0.5. Order is the physical
 * stack tip to crown: lead point, fixed sleeve, nose cone, clutch, grip,
 * reservoir shaft, spring, barrel, clip, cap. Each layer owns exactly one
 * PencilModel group, so the director parts the pencil along its real
 * mechanical axis with no shared-group compromises.
 *
 * `shell` names PencilModel layer groups travelling with this layer.
 * `parts` names Prompt C explode registry ids; the pencil carries none,
 * every moving part is a shell group.
 */
export interface TeardownLayer {
  id: string
  /** Stack index, 0 = tipmost. Drives the separation offset. */
  index: number
  /** PencilModel groups travelling with this layer. */
  shell: ReadonlyArray<PencilPartId>
  /** Parts from Prompt C's layout manifest travelling with this layer. */
  parts: readonly string[]
  /** Copy key into TEARDOWN_COPY in chapters.ts. */
  copyKey: string
  /** Accent hue for this layer's rim light and text accent. */
  accent: string
  /** Hero-side scale bump when featured. */
  featureScale: number
  /**
   * Half-height of the featured subject in meters. Drives the
   * narrow-viewport macro floor so the featured layer never crops: full
   * pencil for the barrel, measured part bounds for the mechanism.
   */
  featureHalfM: number
  /** Heavy layers move slowly with almost no tumble; light layers faster. */
  weight: 'light' | 'medium' | 'heavy'
}

export const TEARDOWN_LAYERS: TeardownLayer[] = [
  {
    id: 'lead',
    index: 0,
    shell: ['lead'],
    parts: [],
    copyKey: 'lead',
    accent: '#7a7268',
    featureScale: 1.14,
    featureHalfM: 0.004, // exposed lead + point
    weight: 'light',
  },
  {
    id: 'sleeve',
    index: 1,
    shell: ['sleeve'],
    parts: [],
    copyKey: 'sleeve',
    accent: '#5f7486',
    featureScale: 1.14,
    featureHalfM: 0.004, // 4mm fixed sleeve
    weight: 'light',
  },
  {
    id: 'nose',
    index: 2,
    shell: ['nose'],
    parts: [],
    copyKey: 'nose',
    accent: '#4f545b',
    featureScale: 1.1,
    featureHalfM: 0.009, // 18mm cone
    weight: 'medium',
  },
  {
    id: 'clutch',
    index: 3,
    shell: ['clutch'],
    parts: [],
    copyKey: 'clutch',
    accent: '#96702c',
    featureScale: 1.14,
    featureHalfM: 0.006, // three-jaw clutch
    weight: 'medium',
  },
  {
    id: 'grip',
    index: 4,
    shell: ['grip'],
    parts: [],
    copyKey: 'grip',
    accent: '#47617a',
    featureScale: 1.08,
    featureHalfM: 0.011, // 22mm knurled grip
    weight: 'medium',
  },
  {
    id: 'shaft',
    index: 5,
    shell: ['shaft'],
    parts: [],
    copyKey: 'shaft',
    accent: '#5f656d',
    featureScale: 1.1,
    featureHalfM: 0.02, // reservoir shaft
    weight: 'medium',
  },
  {
    id: 'spring',
    index: 6,
    shell: ['spring'],
    parts: [],
    copyKey: 'spring',
    accent: '#6e6a5e',
    featureScale: 1.12,
    featureHalfM: 0.007, // 12mm compression spring
    weight: 'light',
  },
  {
    id: 'barrel',
    index: 7,
    shell: ['barrel'],
    parts: [],
    copyKey: 'barrel',
    accent: '#8a5a2c',
    featureScale: 1.06,
    featureHalfM: 0.071, // full 142mm pencil silhouette
    weight: 'heavy',
  },
  {
    id: 'clip',
    index: 8,
    shell: ['clip'],
    parts: [],
    copyKey: 'clip',
    accent: '#7c6a4f',
    featureScale: 1.12,
    featureHalfM: 0.025, // sprung pocket clip
    weight: 'light',
  },
  {
    id: 'cap',
    index: 9,
    shell: ['cap'],
    parts: [],
    copyKey: 'cap',
    accent: '#a05a3c',
    featureScale: 1.1,
    featureHalfM: 0.008, // cap, knock, eraser
    weight: 'light',
  },
]

/** Gap between adjacent layers at full separation, in hero-local meters. */
export const LAYER_GAP = 0.006
/** Tighter gap on narrow viewports so the stack fits. */
export const LAYER_GAP_COMPACT = 0.005

/** Layer offset = (index - (count - 1) / 2) * gap * separation. */
export function layerOffset(index: number, count: number, gap: number, separation: number): number {
  return (index - (count - 1) / 2) * gap * separation
}

/** Part id to layer index, covering the whole explode registry. */
export const PART_LAYER: Record<string, number> = {}
for (const layer of TEARDOWN_LAYERS) {
  for (const part of layer.parts) PART_LAYER[part] = layer.index
}

/**
 * Master-progress to continuous layer cursor 0..10. Ten feature windows of
 * 0.016 across 0.30 to 0.46: integer part is the current layer, fraction
 * is local progress. Pure: reverses exactly.
 */
export function cursorAt(p: number): number {
  return Math.min(10, Math.max(0, (p - 0.3) / 0.016))
}

function smooth01(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

/** Overshooting ease for light layers arriving into the feature pose. */
function easeOutBack01(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  const c1 = 1.30158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

export interface FeatureFrame {
  /** 0..1 detach travel envelope (phase 1 in, phase 4 out). */
  detach: number
  /** 0..1 flip envelope (phase 2 in, phase 4 out). */
  turn: number
  /** 0..1 hero-scale envelope (hold window only). */
  scale: number
}

/**
 * Four-phase feature envelope from local progress: detach 0-0.22, flip
 * 0.18-0.52, hold 0.52-0.80, restack 0.80-1.0 (roughly 1.6x the outbound
 * rate). Writes into `out`: zero allocation per frame. Light layers
 * overshoot on arrival; heavy layers never do. Under reduced motion there
 * is no tumble and no overshoot: detach and scale cross-fade linearly
 * across the same phase landmarks instead of stepping, so scrubbing never
 * teleports a layer (round 01 A7).
 */
export function featureFrame(
  lp: number,
  weight: TeardownLayer['weight'],
  out: FeatureFrame,
  snap = false,
): FeatureFrame {
  if (snap) {
    const clamp01 = (t: number): number => Math.min(1, Math.max(0, t))
    const up = clamp01((lp - 0.02) / 0.2)
    const release = clamp01((0.98 - lp) / 0.18)
    out.detach = Math.min(up, release)
    out.turn = 0
    out.scale = Math.min(clamp01((lp - 0.52) / 0.08), clamp01((0.8 - lp) / 0.08))
    return out
  }
  const back = smooth01((lp - 0.8) / 0.2)
  const amp = 1 - back
  const raw = lp / 0.22
  out.detach = (weight === 'light' ? easeOutBack01(raw) : smooth01(raw)) * amp
  out.turn = smooth01((lp - 0.18) / 0.34) * amp
  out.scale = smooth01((lp - 0.52) / 0.08) * amp
  return out
}

/**
 * Local progress 0..1 for layer i within the feature run. Pure function of
 * the master progress: reverses exactly, trivially testable.
 */
export function layerProgress(
  p: number,
  index: number,
  count: number,
  runStart: number,
  runEnd: number,
): number {
  const window = (runEnd - runStart) / count
  const local = (p - (runStart + window * index)) / window
  return Math.min(1, Math.max(0, local))
}

/** Damping rate per weight class: mass inferable from motion alone. */
export function weightDamp(weight: TeardownLayer['weight']): number {
  if (weight === 'heavy') return 2.2
  if (weight === 'medium') return 4
  return 5.5
}

/**
 * Feature gesture in hero-local meters, scaled to a 9mm instrument:
 * toward the viewer and slightly up. Parts never turn over: a pencil is
 * radially symmetric, so a turnover would read as a flip animation with
 * no physical meaning. Orientation is preserved through every transform.
 */
export const FEATURE_OFFSET = { x: 0.02, y: 0.004, z: 0.012 } as const
/** Identity turnover. Kept as a named constant so the driver reads. */
export const FLIP = { x: 0, y: 0, z: 0 } as const
