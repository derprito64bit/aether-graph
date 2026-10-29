/**
 * Pencil construction lines, the way a draftsman rules a box: each side a
 * touch past its corners, never quite straight, and gone over a second time
 * more lightly. Pure: the same box and seed always draw the same lines.
 */
export interface SketchLine {
  d: string
  /** Seconds after the cue the pen starts this line, and how long it takes. */
  delay: number
  dur: number
  opacity: number
}

/** Deterministic noise in [-1, 1]. */
function noise(n: number): number {
  const v = Math.sin(n * 91.345 + 7.13) * 47453.5453
  return (v - Math.floor(v)) * 2 - 1
}

const r = (n: number) => Math.round(n * 10) / 10

/** A ruled line from a to b, bowed a hair at its middle. */
function ruled(ax: number, ay: number, bx: number, by: number, seed: number): string {
  const mx = (ax + bx) / 2
  const my = (ay + by) / 2
  const len = Math.hypot(bx - ax, by - ay) || 1
  // Perpendicular bow, up to ~0.9 px, more on long lines.
  const bow = noise(seed) * Math.min(0.9, len / 400)
  const nx = -(by - ay) / len
  const ny = (bx - ax) / len
  return `M${r(ax)} ${r(ay)}Q${r(mx + nx * bow)} ${r(my + ny * bow)} ${r(bx)} ${r(by)}`
}

/**
 * Four sides of a w x h box in drawing order (top, right, bottom, left),
 * each overshooting its corners, then a lighter second pass.
 */
export function sketchBox(w: number, h: number, over = 10, seed = 1): SketchLine[] {
  const o = (k: number) => over * (0.55 + 0.45 * Math.abs(noise(seed * 13 + k)))
  const j = (k: number) => noise(seed * 7 + k) * 0.7
  const sides: Array<[number, number, number, number]> = [
    [-o(1), j(1), w + o(2), j(2)],
    [w + j(3), -o(3), w + j(4), h + o(4)],
    [w + o(5), h + j(5), -o(6), h + j(6)],
    [j(7), h + o(7), j(8), -o(8)],
  ]
  const lines: SketchLine[] = []
  const perimeter = 2 * (w + h)
  let t = 0
  sides.forEach(([ax, ay, bx, by], i) => {
    const len = Math.hypot(bx - ax, by - ay)
    const dur = 0.25 + 0.75 * (len / perimeter)
    lines.push({ d: ruled(ax, ay, bx, by, seed + i), delay: t, dur, opacity: 0.62 })
    t += dur * 0.85
  })
  // Second, lighter pass: offset a fraction of a pixel, shorter overshoots.
  sides.forEach(([ax, ay, bx, by], i) => {
    const dx = noise(seed * 3 + i) * 0.8
    const dy = noise(seed * 5 + i) * 0.8
    const k = 0.6
    const cx = (ax + bx) / 2
    const cy = (ay + by) / 2
    lines.push({
      d: ruled(
        cx + (ax - cx) * (1 - (1 - k) * 0.08) + dx,
        cy + (ay - cy) * (1 - (1 - k) * 0.08) + dy,
        cx + (bx - cx) * (1 - (1 - k) * 0.08) + dx,
        cy + (by - cy) * (1 - (1 - k) * 0.08) + dy,
        seed + 10 + i,
      ),
      delay: t * 0.55 + i * 0.12,
      dur: 0.45,
      opacity: 0.28,
    })
  })
  return lines
}

/**
 * A horizontal pencil rule across width w with a drafting scale: a minor
 * tick every `step` px and a major one every fifth.
 */
export function sketchRule(w: number, step = 24, seed = 1): SketchLine[] {
  const lines: SketchLine[] = [
    { d: ruled(-6, 0.5, w + 6, 0.5, seed), delay: 0, dur: 0.9, opacity: 0.6 },
  ]
  const count = Math.floor(w / step)
  for (let i = 0; i <= count; i++) {
    const x = i * step
    const major = i % 5 === 0
    lines.push({
      d: `M${r(x)} 0.5L${r(x + noise(seed + i) * 0.3)} ${major ? 9 : 5}`,
      delay: 0.15 + (x / Math.max(1, w)) * 0.75,
      dur: 0.12,
      opacity: major ? 0.55 : 0.32,
    })
  }
  return lines
}
