import type { ReactNode } from 'react'

/** One-line editorial headline per chapter. */
export function Headline({ children }: { children: ReactNode }) {
  return <h2 className="spec-num mt-3 text-4xl md:text-6xl">{children}</h2>
}
