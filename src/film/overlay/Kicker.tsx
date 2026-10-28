import type { ReactNode } from 'react'

/** Chapter label: cobalt leader, then the topic in mono. */
export function Kicker({ children }: { children: ReactNode }) {
  return <p className="kicker">{children}</p>
}
