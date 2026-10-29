import { useInView } from 'motion/react'
import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { useRevealed } from '../../loader/useRevealed.ts'
import { sketchBox, sketchRule, type SketchLine } from './sketch.ts'

function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (el === null) return
    const measure = () => {
      const w = Math.round(el.clientWidth)
      const h = Math.round(el.clientHeight)
      setSize((prev) => (prev !== null && prev.w === w && prev.h === h ? prev : { w, h }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return size
}

function Lines({ lines, drawn }: { lines: SketchLine[]; drawn: boolean }) {
  return (
    <g data-drawn={drawn ? 'true' : 'false'}>
      {lines.map((l, i) => (
        <path
          key={i}
          d={l.d}
          pathLength={1}
          className="sketch-line"
          opacity={l.opacity}
          style={{ '--s-delay': `${l.delay}s`, '--s-dur': `${l.dur}s` } as CSSProperties}
        />
      ))}
    </g>
  )
}

/**
 * A box ruled in pencil around its parent (which must be positioned): the
 * sides drawn in order the first time it comes into view, each overshooting
 * its corners, then gone over once more lightly. Decorative.
 */
export function SketchFrame({
  overshoot = 12,
  seed = 1,
  className,
}: {
  overshoot?: number
  seed?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const size = useSize(ref)
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const revealed = useRevealed()
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className ?? ''}`}
    >
      {size !== null ? (
        <svg
          width={size.w}
          height={size.h}
          className="absolute inset-0 overflow-visible"
          viewBox={`0 0 ${size.w} ${size.h}`}
        >
          <Lines lines={sketchBox(size.w, size.h, overshoot, seed)} drawn={inView && revealed} />
        </svg>
      ) : null}
    </div>
  )
}

/** A pencil rule with a drafting scale, drawn left to right when seen. */
export function PencilRule({ seed = 1, className }: { seed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const size = useSize(ref)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const revealed = useRevealed()
  return (
    <div ref={ref} aria-hidden="true" className={`relative h-3 w-full ${className ?? ''}`}>
      {size !== null ? (
        <svg
          width={size.w}
          height={12}
          className="absolute inset-0 overflow-visible"
          viewBox={`0 0 ${size.w} 12`}
        >
          <Lines lines={sketchRule(size.w, 24, seed)} drawn={inView && revealed} />
        </svg>
      ) : null}
    </div>
  )
}
