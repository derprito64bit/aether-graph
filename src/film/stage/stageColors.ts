import * as THREE from 'three'
import { ACTS } from '../timeline.ts'
import { STAGE_LIGHTING } from '../lighting.ts'

const scratchColor = new THREE.Color()
const scratchTop = new THREE.Color()
const scratchTarget = new THREE.Color()

/** Relative luminance of a hex colour, WCAG definition. */
export function luminance(hex: string): number {
  const c = hex.replace('#', '')
  const f = (i: number): number => {
    const v = parseInt(c.substr(i, 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4)
}

/** WCAG contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const x = luminance(a)
  const y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/**
 * Text-column scrim alpha from stage lightness (Prompt D section 11).
 * Strengthens as the stage brightens so primary text always clears.
 */
export function scrimForStage(stageHex: string): number {
  return Math.min(1, Math.max(0, (luminance(stageHex) - 0.04) * 6))
}

/** Mixes a hex colour toward near-black ink by alpha (the scrim effect). */
export function applyScrim(stageHex: string, alpha: number): string {
  const mix = (fg: number, bg: number): number => Math.round(fg * alpha + bg * (1 - alpha))
  const c = stageHex.replace('#', '')
  const r = mix(5, parseInt(c.substr(0, 2), 16))
  const g = mix(6, parseInt(c.substr(2, 2), 16))
  const b = mix(10, parseInt(c.substr(4, 2), 16))
  const hex = (v: number): string => v.toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

/**
 * Stage colours as pure functions of progress (Prompt D section 8.2).
 * Within an act, colours lerp from the previous act's stage to this act's,
 * so the colour journey is continuous and reverses exactly on scrub.
 * The teardown act ramps continuously across its whole span instead: the
 * lightening from 0.30 to 0.49 must be obvious side by side (rubric 9).
 */
export function stageColors(p: number): { base: THREE.Color; top: THREE.Color } {
  let index = ACTS.findIndex((act) => p >= act.start && p < act.end)
  if (index < 0) index = p >= 1 ? ACTS.length - 1 : 0
  const act = ACTS[index]
  if (act?.id === 'teardown') {
    // Endpoints come from STAGE_LIGHTING so the generic path meets the ramp
    // seamlessly at both boundaries (round 01 A1): approach at 0.25 in,
    // teardown at 0.52 out, which the camera act then blends away from.
    const t = Math.min(1, Math.max(0, (p - 0.25) / 0.27))
    const start = STAGE_LIGHTING.approach
    const end = STAGE_LIGHTING.teardown
    scratchColor.set(start.stage).lerp(scratchTarget.set(end.stage), t)
    scratchTop.set(start.stageTop).lerp(scratchTarget.set(end.stageTop), t)
    return { base: scratchColor, top: scratchTop }
  }
  const prev = ACTS[Math.max(0, index - 1)]
  const current = STAGE_LIGHTING[act?.id ?? 'arrival']
  const before = STAGE_LIGHTING[prev?.id ?? 'arrival']
  const span = Math.max(1e-5, (act?.end ?? 1) - (act?.start ?? 0))
  const t = Math.min(1, Math.max(0, (p - (act?.start ?? 0)) / span))
  // Colour arrives over the first half of each act, then rests.
  const x = Math.min(1, t * 2)
  const eased = 1 - Math.pow(1 - x, 2)
  scratchColor.set(before.stage).lerp(scratchTarget.set(current.stage), eased)
  scratchTop.set(before.stageTop).lerp(scratchTarget.set(current.stageTop), eased)
  return { base: scratchColor, top: scratchTop }
}
