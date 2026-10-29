import { PENCIL } from '../../data/pencil.ts'
import { Lettering } from '../Lettering/Lettering.tsx'
import { useWriteCue } from '../Lettering/useWriteCue.ts'
import { PencilRule, SketchFrame } from '../Sketch/SketchFrame.tsx'

/**
 * The footer's drawing furniture, split from the footer so the lettering
 * and sketch code stay out of the app shell every page loads first (the
 * footer is always below the fold). Decorative: the footer itself carries
 * the plain sentences for assistive technology.
 */

/** Title block cells: [label, value], lettered in reading order. */
const CELLS: Array<[string, string]> = [
  ['Drawing', 'AG-05'],
  ['Scale', '1:1'],
  ['Units', 'mm'],
  ['Sheet', '1 of 1'],
]

export function FooterRule() {
  return <PencilRule seed={9} className="mb-14" />
}

/** The colophon as a drawing title block, lettered when it comes into view. */
export function TitleBlock({ lines, className }: { lines: string[]; className?: string }) {
  const [ref, cue] = useWriteCue<HTMLDivElement>(0.5)
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`relative w-full max-w-sm self-start ${className ?? ''}`}
    >
      <SketchFrame seed={7} overshoot={8} />
      <div className="title-block">
        <div className="title-block__head">
          <Lettering text={PENCIL.fullName} size={11} weight={1.1} play={cue} delay={0.3} />
        </div>
        <div className="grid grid-cols-2">
          {CELLS.map(([label, value], i) => (
            <div key={label} className="title-block__cell">
              <span className="spec-tech">{label}</span>
              <Lettering text={value} size={9} weight={1.15} play={cue} delay={0.8 + i * 0.25} />
            </div>
          ))}
        </div>
        <div className="title-block__foot">
          {lines.map((line, i) => (
            <Lettering
              key={line}
              text={line}
              size={7}
              weight={1.2}
              maxWidth={240}
              play={cue}
              delay={1.9 + i * 0.6}
              className={i > 0 ? 'mt-1.5' : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
