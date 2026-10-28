import { ListIcon, XIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion, useScroll } from 'motion/react'
import { useEffect, useId, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { pencilPrice } from '../../data/pencil.ts'
import { formatPrice } from '../../lib/format.ts'
import { Glass } from '../Glass/Glass.tsx'
import { AnchorLink } from './AnchorLink.tsx'

const SECTION_LINKS = [
  { id: 'craft', label: 'Craft' },
  { id: 'finishes', label: 'Finishes' },
]

const FROM_PRICE = formatPrice(pencilPrice('graphite', '05'))

function linkClass(isActive: boolean): string {
  return isActive
    ? 'text-(--color-ink)'
    : 'text-(--color-dim) transition-colors hover:text-(--color-ink)'
}

/**
 * Floating glass navbar. One line at every width: on small screens the
 * section links fold into a menu so Buy never drops off. The hairline along
 * the bottom edge is page scroll progress, written by Motion, never state.
 */
export function Navbar() {
  const { scrollYProgress } = useScroll()
  const reduced = useReducedMotion() === true
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="fixed inset-x-0 top-3 z-40 px-3 md:px-4">
      <div className="mx-auto max-w-[1400px]">
        <Glass variant="chrome" label="Primary">
          <nav aria-label="Primary" className="relative flex h-14 items-center gap-6 pr-2 pl-5">
            <Link to="/" className="flex items-baseline gap-1.5" aria-label="Aether Graph home">
              <span className="font-display text-[15px] font-semibold tracking-[-0.01em] [font-stretch:112%]">
                Aether Graph
              </span>
              <span className="font-mono text-[11px] text-(--color-aether)">0.5</span>
            </Link>
            <ul className="hidden items-center gap-6 text-sm md:flex">
              <li>
                <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
                  Film
                </NavLink>
              </li>
              {SECTION_LINKS.map((link) => (
                <li key={link.id}>
                  <AnchorLink id={link.id} className={linkClass(false)}>
                    {link.label}
                  </AnchorLink>
                </li>
              ))}
              <li>
                <NavLink to="/specifications" className={({ isActive }) => linkClass(isActive)}>
                  Specs
                </NavLink>
              </li>
            </ul>
            <div className="ml-auto flex items-center gap-3">
              <span className="spec-tech hidden lg:inline">From {FROM_PRICE}</span>
              <AnchorLink
                id="buy"
                className="btn btn-primary min-h-10 px-5 text-sm"
                testId="nav-buy"
              >
                Buy
              </AnchorLink>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-full text-(--color-ink) hover:bg-(--color-elev) md:hidden"
                aria-expanded={open}
                aria-controls={menuId}
                aria-label={open ? 'Close menu' : 'Open menu'}
                data-testid="nav-menu"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? (
                  <XIcon size={20} weight="regular" />
                ) : (
                  <ListIcon size={20} weight="regular" />
                )}
              </button>
            </div>
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 bottom-0 h-px origin-left bg-(--color-aether)"
              style={{ scaleX: scrollYProgress }}
            />
          </nav>
        </Glass>
        <AnimatePresence>
          {open ? (
            <motion.div
              id={menuId}
              initial={reduced ? false : { opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-2 origin-top md:hidden"
            >
              <Glass variant="panel" label="Menu">
                <ul className="grid gap-1 p-3 text-lg">
                  <li>
                    <Link
                      to="/"
                      className="block rounded-lg px-3 py-2.5 hover:bg-(--color-elev)"
                      onClick={close}
                    >
                      Film
                    </Link>
                  </li>
                  {SECTION_LINKS.map((link) => (
                    <li key={link.id}>
                      <AnchorLink
                        id={link.id}
                        className="block rounded-lg px-3 py-2.5 hover:bg-(--color-elev)"
                        onNavigate={close}
                      >
                        {link.label}
                      </AnchorLink>
                    </li>
                  ))}
                  <li>
                    <Link
                      to="/specifications"
                      className="block rounded-lg px-3 py-2.5 hover:bg-(--color-elev)"
                      onClick={close}
                    >
                      Specs
                    </Link>
                  </li>
                </ul>
              </Glass>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  )
}
