import { useEffect, useState } from 'react'
import { isLoading, onRevealed } from './loader.ts'

/**
 * False while the loading page still covers the site. Entrance animations
 * wait for it, so they play when they can be seen, not behind the loader.
 */
export function useRevealed(): boolean {
  const [revealed, setRevealed] = useState(() => !isLoading())
  useEffect(() => {
    if (!revealed) onRevealed(() => setRevealed(true))
  }, [revealed])
  return revealed
}
