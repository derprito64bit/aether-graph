import { Link } from 'react-router'
import { CONCEPT_NOTICE } from '../../data/product.ts'

/** Shared footer with fiction disclaimer, route index, and license note. */
export function Footer() {
  return (
    <footer className="border-t border-(--color-border-hairline) bg-(--color-night)">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-sm font-semibold">Aether One X</p>
          <p className="mt-2 max-w-sm text-sm text-(--color-dim)">{CONCEPT_NOTICE}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid gap-2 text-sm text-(--color-dim)">
            <li>
              <Link to="/cameras">Cameras</Link>
            </li>
            <li>
              <Link to="/performance">Performance</Link>
            </li>
            <li>
              <Link to="/display">Display</Link>
            </li>
            <li>
              <Link to="/software">Software</Link>
            </li>
            <li>
              <Link to="/specifications">Specifications</Link>
            </li>
          </ul>
        </nav>
        <div className="text-sm text-(--color-faint)">
          <p>MIT License. Procedural local assets only. Zero third-party runtime requests.</p>
          <p className="mt-2">
            <Link to="/#buy">Configure yours</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
