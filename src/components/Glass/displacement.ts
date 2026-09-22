export type GlassProfile = 'convex' | 'concave' | 'lip'

export interface DisplacementMap {
  /** Data URL of the RGBA displacement image. */
  dataUrl: string
  /** Peak displacement in px the map encodes (feeds scale). */
  maxDisplacement: number
  size: number
  profile: GlassProfile
}

const SAMPLES = 127
const IOR = 1.5

/** Height functions. Slope is zero at the center by radial symmetry. */
function heightAt(u: number, profile: GlassProfile): number {
  const x = Math.min(1, Math.max(0, u))
  // Convex dome: flat at the center, steepest at the rim (peak refraction).
  if (profile === 'convex') return 1 - (1 - x * x)
  // Concave dish: steepest at the center, relaxing to the rim.
  if (profile === 'concave') return (1 - x) * (1 - x)
  // Lip: raised rim band with a shallow center.
  return 0.2 + 0.5 * Math.sin(x * Math.PI) ** 2
}

function heightDerivative(u: number, profile: GlassProfile): number {
  const h = 0.001
  return (heightAt(u + h, profile) - heightAt(u - h, profile)) / (2 * h)
}

export interface DisplacementField {
  /** Normalized -1..1 XY displacement per pixel, row-major. */
  x: number[]
  y: number[]
  /** Peak encoded displacement in px (feeds filter scale). */
  maxDisplacement: number
  size: number
  profile: GlassProfile
}

/**
 * Pure displacement field. No DOM, fully unit-testable: the center stays
 * neutral, the rim carries the peak, profiles disagree with each other.
 */
export function sampleField(size: number, profile: GlassProfile): DisplacementField {
  const radius = SAMPLES
  const radial: number[] = []
  let max = 0
  for (let i = 0; i <= radius; i++) {
    const u = i / radius
    const slope = Math.abs(heightDerivative(u, profile))
    const incident = Math.atan(slope)
    const refracted = Math.asin(Math.min(1, Math.sin(incident) / IOR))
    const displacement = Math.tan(incident - refracted) * size * 0.5
    radial.push(displacement)
    max = Math.max(max, Math.abs(displacement))
  }
  const safe = Math.max(1e-6, max)
  const x: number[] = new Array<number>(size * size)
  const y: number[] = new Array<number>(size * size)
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const dx = (px / size - 0.5) * 2
      const dy = (py / size - 0.5) * 2
      const r = Math.min(1, Math.hypot(dx, dy))
      const index = Math.min(radius, Math.round(r * radius))
      const magnitude = (radial[index] ?? 0) / safe
      const inv = r > 1e-6 ? 1 / r : 0
      const offset = py * size + px
      x[offset] = dx * inv * magnitude
      y[offset] = dy * inv * magnitude
    }
  }
  return { x, y, maxDisplacement: safe, size, profile }
}

/**
 * Builds an SVG-filter displacement map for liquid glass refraction.
 * Pure field plus a raster encode; cached per size and profile, rebuilt
 * only on variant change, never per frame. Snell refraction against air
 * (n=1) with IOR 1.5; X in red, Y in green.
 */
export function buildDisplacementMap(size: number, profile: GlassProfile): DisplacementMap {
  const field = sampleField(size, profile)
  const canvas = typeof document === 'undefined' ? null : document.createElement('canvas')
  const ctx = canvas?.getContext('2d') ?? null
  if (canvas === null || ctx === null) {
    // Non-browser runtimes (jsdom tests): deterministic stub URL encoding
    // the parameters. Real browsers always take the raster path below.
    const stub = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><desc>${profile}</desc></svg>`
    return {
      dataUrl: `data:image/svg+xml,${encodeURIComponent(stub)}`,
      maxDisplacement: field.maxDisplacement,
      size,
      profile,
    }
  }
  canvas.width = size
  canvas.height = size
  const image = ctx.createImageData(size, size)
  for (let i = 0; i < size * size; i++) {
    const fx = field.x[i] ?? 0
    const fy = field.y[i] ?? 0
    const offset = i * 4
    image.data[offset] = Math.round(128 + fx * 127)
    image.data[offset + 1] = Math.round(128 + fy * 127)
    image.data[offset + 2] = 128
    image.data[offset + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  return { dataUrl: canvas.toDataURL(), maxDisplacement: field.maxDisplacement, size, profile }
}

export type GlassTier = 'transmission' | 'displacement' | 'layered'

export interface GlassCapabilities {
  webglTransmission: boolean
  svgBackdropFilter: boolean
}

/**
 * Resolves the glass tier from cached capabilities. Tier 1 (physical
 * transmission) lives in the 3D stage on hero surfaces; HTML surfaces
 * resolve to displacement (Chromium) or layered (everyone else).
 */
export function resolveGlassTier(capabilities: GlassCapabilities): GlassTier {
  if (capabilities.webglTransmission) return 'transmission'
  if (capabilities.svgBackdropFilter) return 'displacement'
  return 'layered'
}

/**
 * Detects SVG-filter-as-backdrop support (Chromium only at time of writing).
 * CSS.supports parses but misreports in Firefox, so this is a documented
 * Chromium heuristic, cached at mount. Tier output stays testable through
 * resolveGlassTier regardless.
 */
export function detectSvgBackdropFilter(): boolean {
  try {
    const ua = navigator.userAgent
    return /Chrom(e|ium)/.test(ua) && !/Firefox/.test(ua)
  } catch {
    return false
  }
}
