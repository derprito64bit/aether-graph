import { Link } from 'react-router'
import { CONCEPT_NOTICE, PENCIL } from '../../data/pencil.ts'
import { Lettering } from '../Lettering/Lettering.tsx'
import { useWriteCue } from '../Lettering/useWriteCue.ts'
import { PencilRule, SketchFrame } from '../Sketch/SketchFrame.tsx'
import { AnchorLink } from './AnchorLink.tsx'

/** Title block cells: [label, value], lettered in reading order. */
const CELLS: Array<[string, string]> = [
  ['Drawing', 'AG-05'],
  ['Scale', '1:1'],
  ['Units', 'mm'],
  ['Sheet', '1 of 1'],
]
const BUILD = [
  'Rendered live in three.js.',
  'Local assets only. No third-party requests.',
  'MIT License.',
]

/**
 * The colophon as a drawing title block: a pencil-ruled box, the drawing
 * data in cells, the build notes beneath, all lettered when it comes into
 * view. The plain sentences stay readable to assistive technology.
 */
function TitleBlock({ className }: { className?: string }) {
  const [ref, cue] = useWriteCue<HTMLDivElement>(0.5)
  return (
    <div ref={ref} className={`relative self-start ${className ?? ''}`}>
      <SketchFrame seed={7} overshoot={8} />
      <div className="sr-only">
        {BUILD.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <div aria-hidden="true" className="title-block">
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
          {BUILD.map((line, i) => (
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

/** Shared footer: the instrument's name at full scale, index, fiction notice. */
export function Footer() {
  return (
    <footer>
      <div className="mx-auto max-w-[1400px] px-4 pt-16 pb-10 md:px-8">
        <PencilRule seed={9} className="mb-14" />
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="spec-num display-md">{PENCIL.fullName}</p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-(--color-dim)">
              {CONCEPT_NOTICE}
            </p>
          </div>
          <nav aria-label="Footer" className="md:col-span-3">
            <ul className="grid gap-2.5 text-sm">
              <li>
                <Link to="/" className="text-(--color-dim) hover:text-(--color-ink)">
                  Film
                </Link>
              </li>
              <li>
                <AnchorLink id="craft" className="text-(--color-dim) hover:text-(--color-ink)">
                  Craft
                </AnchorLink>
              </li>
              <li>
                <AnchorLink id="finishes" className="text-(--color-dim) hover:text-(--color-ink)">
                  Finishes
                </AnchorLink>
              </li>
              <li>
                <AnchorLink id="buy" className="text-(--color-dim) hover:text-(--color-ink)">
                  Buy
                </AnchorLink>
              </li>
              <li>
                <Link to="/specifications" className="text-(--color-dim) hover:text-(--color-ink)">
                  Specifications
                </Link>
              </li>
            </ul>
          </nav>
          <TitleBlock className="md:col-span-3" />
        </div>
      </div>
    </footer>
  )
}
