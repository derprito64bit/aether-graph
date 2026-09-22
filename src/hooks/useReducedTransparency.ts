import { useEffect, useState } from 'react'

/** True when the user prefers reduced transparency. Listens for changes. */
export function useReducedTransparency(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-transparency: reduce)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-transparency: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}
