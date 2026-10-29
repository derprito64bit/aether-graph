/**
 * Drafting lettering: an original single-stroke alphabet in the manner of
 * ISO 3098 vertical lettering, the hand capitals of technical drawings.
 * Every glyph is a list of strokes in the order a draftsman writes them,
 * so drawing the strokes in sequence reads as writing.
 *
 * Glyph space: cap line at y = 0, baseline at y = 10 (y down, like SVG),
 * x from 0 to the glyph width. Arcs are flattened into fine polylines so a
 * stroke's length (and so its writing time) is exact and cheap to measure.
 */

export type Pt = readonly [number, number]
export type Stroke = readonly Pt[]

export interface Glyph {
  /** Ink width; the advance adds the letter spacing. */
  w: number
  strokes: readonly Stroke[]
}

/** Cap height in glyph units. */
export const CAP = 10

/** A polyline stroke through the given points. */
function L(...pts: Pt[]): Stroke {
  return pts
}

/**
 * Elliptical arc as a polyline, angles in degrees, screen orientation:
 * 0 points right, 90 points down, so increasing angles turn clockwise.
 */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Stroke {
  const steps = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 6))
  const pts: Pt[] = []
  for (let i = 0; i <= steps; i++) {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)])
  }
  return pts
}

/** One continuous stroke from several pieces (the pen never lifts). */
function cat(...parts: Stroke[]): Stroke {
  const out: Pt[] = []
  for (const part of parts) {
    for (const p of part) {
      const last = out[out.length - 1]
      if (last !== undefined && Math.hypot(last[0] - p[0], last[1] - p[1]) < 1e-6) continue
      out.push(p)
    }
  }
  return out
}

/** A dot: a short stab, so it still reads at small sizes (a colon at 9 px). */
const dot = (x: number, y: number): Stroke => L([x, y - 0.7], [x, y])

export const GLYPHS: Readonly<Record<string, Glyph>> = {
  A: { w: 6, strokes: [L([0, 10], [3, 0], [6, 10]), L([1.05, 6.5], [4.95, 6.5])] },
  B: {
    w: 5.8,
    strokes: [
      L([0, 10], [0, 0]),
      cat(L([0, 0], [3, 0]), arc(3, 2.4, 2.4, 2.4, -90, 90), L([3, 4.8], [0, 4.8])),
      cat(L([0, 4.8], [3.2, 4.8]), arc(3.2, 7.4, 2.6, 2.6, -90, 90), L([3.2, 10], [0, 10])),
    ],
  },
  C: { w: 6.2, strokes: [arc(3.2, 5, 3.2, 5, -40, -320)] },
  D: {
    w: 5.8,
    strokes: [
      L([0, 0], [0, 10]),
      cat(L([0, 0], [2, 0]), arc(2, 5, 3.8, 5, -90, 90), L([2, 10], [0, 10])),
    ],
  },
  E: { w: 5, strokes: [L([5, 0], [0, 0], [0, 10], [5, 10]), L([0, 4.8], [3.8, 4.8])] },
  F: { w: 5, strokes: [L([5, 0], [0, 0], [0, 10]), L([0, 4.8], [3.8, 4.8])] },
  G: { w: 6.4, strokes: [cat(arc(3.2, 5, 3.2, 5, -40, -360), L([6.4, 5], [3.6, 5]))] },
  H: { w: 5.6, strokes: [L([0, 0], [0, 10]), L([5.6, 0], [5.6, 10]), L([0, 4.8], [5.6, 4.8])] },
  I: { w: 0, strokes: [L([0, 0], [0, 10])] },
  J: { w: 4.6, strokes: [cat(L([4.6, 0], [4.6, 7.6]), arc(2.3, 7.6, 2.3, 2.4, 0, 180))] },
  K: { w: 5.6, strokes: [L([0, 0], [0, 10]), L([5.6, 0], [0, 6.2]), L([1.9, 4.1], [5.6, 10])] },
  L: { w: 4.8, strokes: [L([0, 0], [0, 10], [4.8, 10])] },
  M: { w: 7, strokes: [L([0, 10], [0, 0], [3.5, 6.6], [7, 0], [7, 10])] },
  N: { w: 5.8, strokes: [L([0, 10], [0, 0], [5.8, 10], [5.8, 0])] },
  O: { w: 6.6, strokes: [arc(3.3, 5, 3.3, 5, -90, 270)] },
  P: {
    w: 5.6,
    strokes: [
      L([0, 10], [0, 0]),
      cat(L([0, 0], [3, 0]), arc(3, 2.6, 2.6, 2.6, -90, 90), L([3, 5.2], [0, 5.2])),
    ],
  },
  Q: { w: 6.6, strokes: [arc(3.3, 5, 3.3, 5, -90, 270), L([3.9, 7], [6.6, 10.4])] },
  R: {
    w: 5.8,
    strokes: [
      L([0, 10], [0, 0]),
      cat(L([0, 0], [3, 0]), arc(3, 2.6, 2.6, 2.6, -90, 90), L([3, 5.2], [0, 5.2])),
      L([2.8, 5.2], [5.8, 10]),
    ],
  },
  S: {
    w: 5.6,
    strokes: [cat(arc(2.8, 2.6, 2.6, 2.6, -30, -270), arc(2.8, 7.6, 2.8, 2.4, -90, 150))],
  },
  T: { w: 6, strokes: [L([0, 0], [6, 0]), L([3, 0], [3, 10])] },
  U: {
    w: 5.8,
    strokes: [cat(L([0, 0], [0, 7.1]), arc(2.9, 7.1, 2.9, 2.9, 180, 0), L([5.8, 7.1], [5.8, 0]))],
  },
  V: { w: 6, strokes: [L([0, 0], [3, 10], [6, 0])] },
  W: { w: 8, strokes: [L([0, 0], [2, 10], [4, 2.4], [6, 10], [8, 0])] },
  X: { w: 6, strokes: [L([0, 0], [6, 10]), L([6, 0], [0, 10])] },
  Y: { w: 6, strokes: [L([0, 0], [3, 5], [6, 0]), L([3, 5], [3, 10])] },
  Z: { w: 5.6, strokes: [L([0, 0], [5.6, 0], [0, 10], [5.6, 10])] },

  '0': { w: 5.6, strokes: [arc(2.8, 5, 2.8, 5, -90, 270)] },
  '1': { w: 2.6, strokes: [L([0, 2], [2.6, 0], [2.6, 10])] },
  '2': { w: 5.6, strokes: [cat(arc(2.8, 2.8, 2.8, 2.8, -165, 20), L([0, 10], [5.6, 10]))] },
  '3': {
    w: 5.6,
    strokes: [cat(arc(2.7, 2.5, 2.6, 2.5, -160, 90), arc(2.7, 7.5, 2.9, 2.5, -90, 160))],
  },
  '4': { w: 6, strokes: [L([4.4, 10], [4.4, 0], [0, 7], [6, 7])] },
  '5': {
    w: 5.6,
    strokes: [cat(L([5.2, 0], [0.6, 0], [0.3, 4.6]), arc(2.7, 6.9, 2.9, 3.1, -140, 150))],
  },
  '6': {
    w: 5.8,
    strokes: [cat(arc(2.9, 5, 2.9, 5, -50, -180), arc(2.9, 7.3, 2.9, 2.7, 180, -180))],
  },
  '7': { w: 5.6, strokes: [L([0, 0], [5.6, 0], [2, 10])] },
  '8': { w: 5.6, strokes: [arc(2.8, 2.5, 2.4, 2.5, 90, 450), arc(2.8, 7.45, 2.8, 2.55, -90, 270)] },
  '9': { w: 5.8, strokes: [cat(arc(2.9, 2.7, 2.9, 2.7, 0, -360), arc(2.9, 5, 2.9, 5, 0, 130))] },

  '.': { w: 0.6, strokes: [dot(0.3, 10)] },
  ',': { w: 1.2, strokes: [L([0.8, 9.4], [0.8, 10], [0, 11.6])] },
  ':': { w: 0.6, strokes: [dot(0.3, 4), dot(0.3, 10)] },
  '·': { w: 0.6, strokes: [dot(0.3, 5.4)] },
  ';': { w: 1.2, strokes: [dot(0.8, 4), L([0.8, 9.4], [0.8, 10], [0, 11.6])] },
  '-': { w: 3.6, strokes: [L([0, 5.2], [3.6, 5.2])] },
  '–': { w: 5, strokes: [L([0, 5.2], [5, 5.2])] },
  '/': { w: 4, strokes: [L([0, 10.6], [4, -0.6])] },
  '×': { w: 4.4, strokes: [L([0, 3], [4.4, 7.4]), L([4.4, 3], [0, 7.4])] },
  '±': { w: 5, strokes: [L([2.5, 1.4], [2.5, 6.6]), L([0, 4], [5, 4]), L([0, 9.4], [5, 9.4])] },
  Ø: { w: 6.6, strokes: [arc(3.3, 5, 3.3, 5, -90, 270), L([-0.4, 10.6], [7, -0.6])] },
  '°': { w: 2.6, strokes: [arc(1.3, 1.3, 1.3, 1.3, -90, 270)] },
  '(': { w: 1.8, strokes: [arc(3.6, 5, 3.6, 6.2, -125, -235)] },
  ')': { w: 1.8, strokes: [arc(-1.8, 5, 3.6, 6.2, -55, 55)] },
  "'": { w: 0.6, strokes: [L([0.3, 0], [0.3, 2.6])] },
  '"': { w: 2, strokes: [L([0.3, 0], [0.3, 2.6]), L([1.7, 0], [1.7, 2.6])] },
  '#': {
    w: 6,
    strokes: [
      L([1.8, 0.6], [1.2, 9.4]),
      L([4.8, 0.6], [4.2, 9.4]),
      L([0, 3.4], [6, 3.4]),
      L([0, 6.6], [6, 6.6]),
    ],
  },
  '+': { w: 5, strokes: [L([2.5, 2.6], [2.5, 7.8]), L([0, 5.2], [5, 5.2])] },
  '=': { w: 5, strokes: [L([0, 3.8], [5, 3.8]), L([0, 6.6], [5, 6.6])] },
  '%': {
    w: 6.4,
    strokes: [
      arc(1.3, 1.6, 1.3, 1.6, -90, 270),
      L([0.2, 10.4], [6.2, -0.4]),
      arc(5.1, 8.4, 1.3, 1.6, -90, 270),
    ],
  },
  '→': { w: 7, strokes: [L([0, 5.2], [7, 5.2]), L([4.8, 3], [7, 5.2], [4.8, 7.4])] },
  '!': { w: 0.6, strokes: [L([0.3, 0], [0.3, 6.8]), dot(0.3, 10)] },
  $: {
    w: 5.6,
    strokes: [
      cat(arc(2.8, 2.6, 2.6, 2.6, -30, -270), arc(2.8, 7.6, 2.8, 2.4, -90, 150)),
      L([2.8, -1], [2.8, 11]),
    ],
  },
}

/** Letter spacing and word space, ISO style: 2d and 6d at d = h/10. */
export const LETTER_SPACE = 2
export const WORD_SPACE = 6
export const LINE_HEIGHT = 16

/** True when every character of the text has a glyph (case-insensitive). */
export function isLetterable(text: string): boolean {
  for (const ch of text.toUpperCase()) {
    if (ch === ' ' || ch === '\n') continue
    if (GLYPHS[ch] === undefined) return false
  }
  return true
}
