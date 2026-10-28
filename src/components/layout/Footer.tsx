import { Link } from 'react-router'
import { CONCEPT_NOTICE, PENCIL } from '../../data/pencil.ts'
import { AnchorLink } from './AnchorLink.tsx'

/** Shared footer: the instrument's name at full scale, index, fiction notice. */
export function Footer() {
  return (
    <footer className="border-t border-(--color-border-hairline)">
      <div className="mx-auto max-w-[1400px] px-4 pt-16 pb-10 md:px-8">
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
          <div className="spec-tech md:col-span-3">
            <p>Rendered live in three.js.</p>
            <p className="mt-1">Local assets only. No third-party requests.</p>
            <p className="mt-1">MIT License.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
