import { PENCIL } from '../data/pencil.ts'
import type { ActId } from './key.ts'
import type { NoteAnchor } from './overlay/callouts.ts'
import { ACTS } from './timeline.ts'

/**
 * Margin notes: the film annotated in a draftsman's hand. Each note sits in
 * the part of the frame the shot leaves empty and runs a leader to a point
 * on the pencil. Figures come from src/data, like every other caption.
 */
export interface FilmNote {
  id: string
  act: ActId
  text: string
  anchor: NoteAnchor
  /** Which side of the pencil the note sits on (its leader leaves the inner edge). */
  side: 'left' | 'right'
  /** Inner edge of the note, as fractions of the stage (desktop layout). */
  x: number
  y: number
  /** Act-local window in which the note is written. */
  from: number
  to: number
}

export const FILM_NOTES: FilmNote[] = [
  {
    id: 'hero-length',
    act: 'hero',
    text: `${PENCIL.lengthMm} mm overall`,
    anchor: 'cap',
    side: 'right',
    x: 0.73,
    y: 0.13,
    from: 0,
    to: 0.3,
  },
  {
    id: 'hero-barrel',
    act: 'hero',
    text: `Ø${PENCIL.barrelDiamMm} barrel, anodised`,
    anchor: 'barrel',
    side: 'right',
    x: 0.71,
    y: 0.4,
    from: 0,
    to: 0.3,
  },
  {
    id: 'hero-lead',
    act: 'hero',
    text: `${PENCIL.leadDiamMm} mm lead, ${PENCIL.clutchJaws}-jaw clutch`,
    anchor: 'tip',
    side: 'right',
    x: 0.6,
    y: 0.76,
    from: 0,
    to: 0.3,
  },
  {
    id: 'detail-balance',
    act: 'detail',
    text: `Balance point ${PENCIL.balanceFromTipMm} mm from tip`,
    anchor: 'balance',
    side: 'left',
    x: 0.31,
    y: 0.36,
    from: 0.14,
    to: 0.4,
  },
  {
    id: 'detail-knurl',
    act: 'detail',
    text: `Knurl ${PENCIL.knurlPitchMm} × ${PENCIL.knurlDepthMm}, cut not rolled`,
    anchor: 'grip',
    side: 'left',
    x: 0.31,
    y: 0.56,
    from: 0.22,
    to: 0.5,
  },
  {
    id: 'detail-sleeve',
    act: 'detail',
    text: `Sleeve ${PENCIL.sleeveLengthMm} mm, fixed`,
    anchor: 'sleeve',
    side: 'left',
    x: 0.31,
    y: 0.76,
    from: 0.3,
    to: 0.58,
  },
  {
    id: 'xray-spring',
    act: 'xray',
    text: `Spring ${PENCIL.springMm} mm, replaceable`,
    anchor: 'spring',
    side: 'left',
    x: 0.33,
    y: 0.22,
    from: 0.12,
    to: 0.4,
  },
  {
    id: 'xray-store',
    act: 'xray',
    text: 'Spare-lead store',
    anchor: 'shaft',
    side: 'left',
    x: 0.33,
    y: 0.46,
    from: 0.2,
    to: 0.46,
  },
  {
    id: 'xray-clutch',
    act: 'xray',
    text: `Clutch: ${PENCIL.clutchJaws} brass jaws`,
    anchor: 'clutch',
    side: 'left',
    x: 0.33,
    y: 0.72,
    from: 0.28,
    to: 0.54,
  },
  {
    id: 'mech-jaws',
    act: 'mechanism',
    text: `Jaws close to ${PENCIL.clutchToleranceMm} mm`,
    anchor: 'clutch',
    side: 'left',
    x: 0.3,
    y: 0.62,
    from: 0.2,
    to: 0.46,
  },
  {
    id: 'mech-knock',
    act: 'mechanism',
    text: `${PENCIL.advanceMm} mm per knock`,
    anchor: 'lead',
    side: 'left',
    x: 0.3,
    y: 0.84,
    from: 0.3,
    to: 0.56,
  },
  {
    id: 're-cap',
    act: 'reassembly',
    text: 'Cap and knock unscrew',
    anchor: 'cap',
    side: 'left',
    x: 0.38,
    y: 0.14,
    from: 0.12,
    to: 0.38,
  },
  {
    id: 're-spring',
    act: 'reassembly',
    text: 'Spring slides free',
    anchor: 'spring',
    side: 'right',
    x: 0.62,
    y: 0.22,
    from: 0.18,
    to: 0.44,
  },
  {
    id: 're-grip',
    act: 'reassembly',
    text: 'Grip unscrews',
    anchor: 'grip',
    side: 'right',
    x: 0.62,
    y: 0.48,
    from: 0.24,
    to: 0.5,
  },
  {
    id: 're-clutch',
    act: 'reassembly',
    text: 'Clutch lifts out for cleaning',
    anchor: 'clutch',
    side: 'left',
    x: 0.38,
    y: 0.52,
    from: 0.3,
    to: 0.56,
  },
  ...(['Graphite', 'Steel', 'Brass', 'Ember'] as const).map((name, k): FilmNote => ({
    id: `fan-${name.toLowerCase()}`,
    act: 'final',
    text: name,
    anchor: `fan${k}` as NoteAnchor,
    side: 'right',
    x: 0.75,
    y: 0.16 + 0.07 * k,
    from: 0.12 + 0.08 * k,
    to: 0.3 + 0.08 * k,
  })),
]

const ACT_BY_ID = Object.fromEntries(ACTS.map((a) => [a.id, a])) as Partial<
  Record<ActId, (typeof ACTS)[number]>
>

/** Act-local fraction of the span erased at the end, so notes never pop. */
const ERASE = 0.1

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/**
 * How much of a note is written at film progress p, 0..1. It writes across
 * its window, holds, and is erased (written backwards) over the last tenth
 * of its act. A pure function of progress, so scrubbing back erases it and
 * scrubbing forward writes it again.
 */
export function noteWritten(note: FilmNote, p: number): number {
  // Called per note per frame: a lookup, never a search or an allocation.
  const act = ACT_BY_ID[note.act]
  if (act === undefined) return 0
  const span = act.end - act.start
  const local = (p - act.start) / span
  const writeIn = clamp01((local - note.from) / (note.to - note.from))
  const writeOut = clamp01((1 - local) / ERASE)
  return Math.min(writeIn, writeOut)
}
