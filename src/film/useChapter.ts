import { useMotionValueEvent, type MotionValue } from 'motion/react'
import { useState } from 'react'
import type { ActDef } from './key.ts'
import { actAt } from './timeline.ts'

/** Maps master progress to the current act. State updates on act change only. */
export function useChapter(progress: MotionValue<number>): ActDef {
  const [act, setAct] = useState<ActDef>(() => actAt(progress.get()))
  useMotionValueEvent(progress, 'change', (v) => {
    const next = actAt(typeof v === 'number' ? v : 0)
    setAct((prev: ActDef) => (prev.id === next.id ? prev : next))
  })
  return act
}
