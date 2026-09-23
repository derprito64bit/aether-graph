import { describe, expect, it } from 'vitest'
import { LEAD_OPTIONS, PENCIL, PENCIL_FINISHES } from '../data/pencil.ts'
import { CHAPTERS, TEARDOWN_COPY } from './chapters.ts'
import { TEARDOWN_LAYERS } from './teardown/layers.ts'
import { ACTS } from './timeline.ts'

/** The film overlay and the specifications table can never disagree. */
describe('chapter spec consistency', () => {
  it('covers every act exactly once', () => {
    const ids = CHAPTERS.map((c) => c.act).sort()
    expect(ids).toEqual(ACTS.map((a) => a.id).sort())
  })

  it('uses data values for every figure it renders', () => {
    const text = CHAPTERS.map((c) =>
      [c.kicker, c.headline, c.body, c.numeral?.value ?? '', ...(c.spec ?? [])].join(' | '),
    ).join('\n')
    const required: string[] = [
      PENCIL.fullName,
      String(PENCIL.weightG),
      String(PENCIL.leadDiamMm),
      String(PENCIL.partCount),
      String(PENCIL.clutchJaws),
      String(PENCIL.knurlPitchMm),
      String(PENCIL.advanceMm),
      String(PENCIL.lengthMm),
      PENCIL_FINISHES[0]?.name ?? 'Graphite',
      LEAD_OPTIONS[0]?.label ?? '0.5 mm',
    ]
    for (const needle of required) {
      expect(text).toContain(needle)
    }
  })

  it('carries copy for every teardown layer', () => {
    expect(TEARDOWN_COPY.map((c) => c.key).sort()).toEqual(
      TEARDOWN_LAYERS.map((l) => l.copyKey).sort(),
    )
  })
})
