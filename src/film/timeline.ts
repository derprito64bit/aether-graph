import { DETAIL_KEYS } from './acts/detail.ts'
import { EXPLODED_KEYS } from './acts/exploded.ts'
import { FINAL_KEYS } from './acts/final.ts'
import { HERO_KEYS } from './acts/hero.ts'
import { MECHANISM_KEYS } from './acts/mechanism.ts'
import { REASSEMBLY_KEYS } from './acts/reassembly.ts'
import { XRAY_KEYS } from './acts/xray.ts'
import type { ActDef, FilmKey } from './key.ts'

export const ACTS: ActDef[] = [
  { id: 'hero', start: 0, end: 0.12, align: 'center' },
  { id: 'detail', start: 0.12, end: 0.24, align: 'right' },
  { id: 'exploded', start: 0.24, end: 0.48, align: 'left' },
  { id: 'xray', start: 0.48, end: 0.6, align: 'left' },
  { id: 'mechanism', start: 0.6, end: 0.74, align: 'right' },
  { id: 'reassembly', start: 0.74, end: 0.86, align: 'center' },
  { id: 'final', start: 0.86, end: 1, align: 'left' },
]

/** Master keyframe list in authored order. Validated by validateTimeline. */
export const KEYS: FilmKey[] = [
  ...HERO_KEYS,
  ...DETAIL_KEYS,
  ...EXPLODED_KEYS,
  ...XRAY_KEYS,
  ...MECHANISM_KEYS,
  ...REASSEMBLY_KEYS,
  ...FINAL_KEYS,
]

/** Returns the act containing progress p in fraction units. */
export function actAt(p: number): ActDef {
  for (const act of ACTS) {
    if (p < act.end) return act
  }
  const last = ACTS[ACTS.length - 1]
  if (last === undefined) throw new Error('ACTS must not be empty')
  return last
}
