import { useInView } from 'motion/react'
import { useRef, type RefObject } from 'react'
import { useRevealed } from '../../loader/useRevealed.ts'

/**
 * Cue for lettering that writes itself: true once the element is in view
 * and the loading page has gone, and stays true.
 */
export function useWriteCue<T extends Element>(amount = 0.4): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const inView = useInView(ref, { once: true, amount })
  const revealed = useRevealed()
  return [ref, inView && revealed]
}
