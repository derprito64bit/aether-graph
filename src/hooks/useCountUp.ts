import { useEffect, useRef, useState } from 'react'

/**
 * Numeral count-up on entry. Springs are for direct manipulation; a
 * system-initiated reveal gets an eased 640ms duration (slow token).
 * Reduced motion renders the final value immediately.
 */
export function useCountUp(target: number, active: boolean, durationMs = 640): number {
  const [value, setValue] = useState(active ? target : 0)
  const from = useRef(0)
  useEffect(() => {
    if (!active) {
      from.current = 0
      setValue(0)
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    const start = from.current
    const t0 = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs)
      const eased = 1 - (1 - t) * (1 - t) * (1 - t)
      const v = start + (target - start) * eased
      setValue(v)
      if (t < 1) frame = requestAnimationFrame(tick)
      else from.current = target
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, target, durationMs])
  return value
}
