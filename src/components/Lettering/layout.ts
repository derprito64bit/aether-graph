import { CAP, GLYPHS, LETTER_SPACE, LINE_HEIGHT, WORD_SPACE, type Glyph } from './strokeFont.ts'

export interface LaidStroke {
  /** SVG path data in glyph units, already offset to its place in the text. */
  d: string
  /** Ink length in glyph units. */
  length: number
  /** When the pen starts and finishes this stroke, as fractions of the whole. */
  start: number
  end: number
}

export interface LaidText {
  strokes: LaidStroke[]
  /** Widest line, glyph units. */
  width: number
  /** Cap line of the first line to the baseline of the last, glyph units. */
  height: number
  lines: number
  /** Writing time in glyph-length units (ink plus pen lifts). */
  duration: number
}

/** Pen lift between strokes and the pause between words, in length units. */
const LIFT = 2.5
const WORD_PAUSE = 7

function wordWidth(word: string): number {
  let w = 0
  let n = 0
  for (const ch of word) {
    const g = GLYPHS[ch]
    w += g?.w ?? 0
    n++
  }
  return w + LETTER_SPACE * Math.max(0, n - 1)
}

/** Greedy wrap of upper-cased words to a width in glyph units. */
export function wrapLettering(text: string, maxWidth = Infinity): string[][] {
  const lines: string[][] = []
  for (const para of text.toUpperCase().split('\n')) {
    let line: string[] = []
    let width = 0
    for (const word of para.split(' ').filter((w) => w.length > 0)) {
      const ww = wordWidth(word)
      const next = line.length === 0 ? ww : width + WORD_SPACE + ww
      if (line.length > 0 && next > maxWidth) {
        lines.push(line)
        line = [word]
        width = ww
      } else {
        line.push(word)
        width = next
      }
    }
    lines.push(line)
  }
  return lines
}

function strokeLength(pts: readonly (readonly [number, number])[]): number {
  let len = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    if (a !== undefined && b !== undefined) len += Math.hypot(b[0] - a[0], b[1] - a[1])
  }
  return len
}

const f = (n: number): string => (Math.round(n * 100) / 100).toString()

/**
 * A hand never sets two letters exactly alike: each glyph sits a hair off
 * its ideal place. Deterministic, so the same text letters the same way.
 */
function jitter(n: number): [number, number] {
  const a = Math.sin(n * 12.9898) * 43758.5453
  const b = Math.sin(n * 78.233) * 12345.6789
  return [(a - Math.floor(a) - 0.5) * 0.3, (b - Math.floor(b) - 0.5) * 0.4]
}

/**
 * Lays drafting lettering out as strokes in writing order: line by line,
 * letter by letter, each glyph's strokes in the order they are drawn.
 * Pure: the same text always yields the same strokes and timings.
 */
export function layoutLettering(text: string, maxWidth = Infinity): LaidText {
  const lines = wrapLettering(text, maxWidth)
  const strokes: Omit<LaidStroke, 'start' | 'end'>[] = []
  const times: Array<[number, number]> = []
  let clock = 0
  let widest = 0
  let glyphIndex = 0
  lines.forEach((words, li) => {
    const y0 = li * LINE_HEIGHT
    let x = 0
    words.forEach((word, wi) => {
      if (wi > 0) {
        x += WORD_SPACE
        clock += WORD_PAUSE
      }
      let first = true
      for (const ch of word) {
        const g: Glyph | undefined = GLYPHS[ch]
        if (!first) x += LETTER_SPACE
        first = false
        if (g === undefined) continue
        const [jx, jy] = jitter(++glyphIndex)
        for (const s of g.strokes) {
          const length = strokeLength(s)
          if (strokes.length > 0) clock += LIFT
          const d = s
            .map((p, i) => `${i === 0 ? 'M' : 'L'}${f(p[0] + x + jx)} ${f(p[1] + y0 + jy)}`)
            .join('')
          strokes.push({ d, length })
          times.push([clock, clock + length])
          clock += length
        }
        x += g.w
      }
    })
    widest = Math.max(widest, x)
  })
  const duration = Math.max(clock, 1e-6)
  return {
    strokes: strokes.map((s, i) => ({
      ...s,
      start: (times[i]?.[0] ?? 0) / duration,
      end: (times[i]?.[1] ?? 0) / duration,
    })),
    width: widest,
    height: (lines.length - 1) * LINE_HEIGHT + CAP,
    lines: lines.length,
    duration,
  }
}
