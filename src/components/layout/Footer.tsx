import { Suspense, lazy } from 'react'
import { Link } from 'react-router'
import { CONCEPT_NOTICE, PENCIL } from '../../data/pencil.ts'
import { AnchorLink } from './AnchorLink.tsx'

const BUILD = [
  'Rendered live in three.js.',
  'Local assets only. No third-party requests.',
  'MIT License.',
]

// Drawing furniture loads on its own: the footer is always below the fold,
// and the lettering and sketch code stay out of the shell every page loads.
const FooterRule = lazy(() => import('./FooterSheet.tsx').then((m) => ({ default: m.FooterRule })))
const TitleBlock = lazy(() => import('./FooterSheet.tsx').then((m) => ({ default: m.TitleBlock })))

/** Shared footer: the instrument's name at full scale, index, fiction notice. */
export function Footer() {
  return (
    <footer>
      <div className="mx-auto max-w-[1400px] px-4 pt-16 pb-10 md:px-8">
        <Suspense fallback={<div className="mb-14 h-3" />}>
          <FooterRule />
        </Suspense>
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="spec-num display-md">{PENCIL.fullName}</p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-(--color-dim)">
              {CONCEPT_NOTICE}
            </p>
          </div>
          <nav aria-label="Footer" className="lg:col-span-2">
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
          <div className="md:col-span-2 lg:col-span-4">
            <div className="sr-only">
              {BUILD.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <Suspense fallback={<div className="min-h-72 w-full max-w-sm" />}>
              <TitleBlock lines={BUILD} />
            </Suspense>
          </div>
        </div>
      </div>
    </footer>
  )
}
