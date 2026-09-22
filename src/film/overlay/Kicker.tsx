import type { ReactNode } from 'react'

/** Mono uppercase kicker opening each chapter. */
export function Kicker({ children }: { children: ReactNode }) {
  return <p className="kicker">{children}</p>
}
