import { Link, NavLink } from 'react-router'
import { Glass } from '../Glass/Glass.tsx'

const ROUTE_LINKS = [
  { to: '/', label: 'Film', end: true },
  { to: '/specifications', label: 'Specs', end: false },
]

const ANCHOR_LINKS = [
  { href: '#family', label: 'Family' },
  { href: '#craft', label: 'Craft' },
]

/** Route-aware floating navbar. A liquid-glass chrome pill, not a full bar. */
export function Navbar() {
  return (
    <header className="sticky top-3 z-40 mx-auto max-w-6xl px-4">
      <Glass variant="chrome" label="Primary">
        <nav aria-label="Primary" className="flex h-12 items-center gap-5 px-5">
          <Link to="/" className="font-display text-sm font-semibold tracking-wide">
            Aether Graph
          </Link>
          <ul className="flex flex-wrap items-center gap-4 text-sm">
            {ROUTE_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }: { isActive: boolean }) =>
                    isActive ? 'text-(--color-ink)' : 'text-(--color-dim) hover:text-(--color-ink)'
                  }
                  aria-current={undefined}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            {ANCHOR_LINKS.map((link) => (
              <li key={link.href}>
                <a href={`/${link.href}`} className="text-(--color-dim) hover:text-(--color-ink)">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="/#buy"
            data-testid="skip-film"
            className="kicker ml-auto hidden sm:block"
            onClick={() => {
              // Move focus with the jump so keyboard and screen-reader
              // users land in the configurator, not just the viewport.
              window.setTimeout(() => {
                document.getElementById('buy')?.focus({ preventScroll: true })
              }, 450)
            }}
          >
            Skip film · Buy
          </a>
        </nav>
      </Glass>
    </header>
  )
}
