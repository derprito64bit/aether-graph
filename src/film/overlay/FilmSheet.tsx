import { Lettering } from '../../components/Lettering/Lettering.tsx'
import { useRevealed } from '../../loader/useRevealed.ts'
import type { ActDef, ActId } from '../key.ts'
import { ACTS } from '../timeline.ts'
import { ACT_NAMES } from './ActRuler.tsx'

/** Drawing scale per sheet: how close the shot sits. */
const SCALE: Record<ActId, string> = {
  hero: '1:1',
  detail: '2:1',
  exploded: '1:1',
  xray: '2:1',
  mechanism: '5:1',
  reassembly: '1:1',
  final: '1:1',
}

const COLUMNS = ['1', '2', '3', '4', '5', '6', '7', '8']
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F']
const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The film as a drawing sheet: a lens vignette for depth, a double border
 * ruled clockwise on arrival with zone marks (numbers along the foot,
 * letters up the side), and a sheet tag that re-letters itself with every
 * act. Sheet furniture is desktop only; phones keep the vignette.
 */
export function FilmSheet({ act }: { act: ActDef }) {
  const revealed = useRevealed()
  const index = ACTS.findIndex((a) => a.id === act.id) + 1
  return (
    <div aria-hidden="true" className="film-sheet pointer-events-none absolute inset-0">
      <div className="film-vignette absolute inset-0" />
      <div className="hidden md:block" data-drawn={revealed ? 'true' : 'false'}>
        <div className="sheet-rule sheet-rule--top" />
        <div className="sheet-rule sheet-rule--right" />
        <div className="sheet-rule sheet-rule--bottom" />
        <div className="sheet-rule sheet-rule--left" />
        <div className="sheet-rule sheet-rule--inner" />
        {COLUMNS.map((c, i) => (
          <div
            key={c}
            className="sheet-zone sheet-zone--col"
            style={{ left: `calc(1.25rem + (100% - 2.5rem) * ${(i + 0.5) / COLUMNS.length})` }}
          >
            <Lettering text={c} size={7} weight={1.2} play={revealed} delay={0.9 + i * 0.05} />
          </div>
        ))}
        {COLUMNS.slice(1).map((c, i) => (
          <div
            key={`t${c}`}
            className="sheet-tick sheet-tick--col"
            style={{ left: `calc(1.25rem + (100% - 2.5rem) * ${(i + 1) / COLUMNS.length})` }}
          />
        ))}
        {ROWS.map((r, i) => (
          <div
            key={r}
            className="sheet-zone sheet-zone--row"
            style={{ top: `calc(1.25rem + (100% - 2.5rem) * ${(i + 0.5) / ROWS.length})` }}
          >
            <Lettering text={r} size={7} weight={1.2} play={revealed} delay={1.3 + i * 0.05} />
          </div>
        ))}
        {ROWS.slice(1).map((r, i) => (
          <div
            key={`t${r}`}
            className="sheet-tick sheet-tick--row"
            style={{ top: `calc(1.25rem + (100% - 2.5rem) * ${(i + 1) / ROWS.length})` }}
          />
        ))}
        <div className="sheet-tag" key={act.id}>
          <Lettering text={`DWG AG-05-${pad(index)}`} size={9} weight={1.15} play={revealed} />
          <Lettering
            text={`Sheet ${pad(index)} of ${pad(ACTS.length)} · ${ACT_NAMES[act.id]} · Scale ${SCALE[act.id]}`}
            size={7}
            weight={1.2}
            play={revealed}
            delay={0.35}
            className="mt-1.5"
          />
        </div>
      </div>
    </div>
  )
}
