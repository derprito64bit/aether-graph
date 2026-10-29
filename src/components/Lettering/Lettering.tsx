import type { MotionValue } from 'motion/react'
import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { layoutLettering } from './layout.ts'
import { CAP } from './strokeFont.ts'

export interface LetteringProps {
  text: string
  /** Cap height in px. */
  size: number
  /** Stroke width in glyph units: 1 is ISO type B (a tenth of the cap height). */
  weight?: number
  /** Wrap width in px. */
  maxWidth?: number
  /**
   * Scroll-driven: the fraction of the text written, 0..1. Written straight
   * to the DOM, so scrubbing backwards erases exactly what was written.
   */
  progress?: MotionValue<number>
  /** Time-driven: writes itself once this turns true. */
  play?: boolean
  /** Writing speed, glyph units per second. */
  speed?: number
  /** Seconds before the pen starts (time-driven only). */
  delay?: number
  /** Accessible text. Without it the lettering is decorative. */
  label?: string
  align?: 'left' | 'right' | 'center'
  className?: string
  style?: CSSProperties
}

const REDUCED = '(prefers-reduced-motion: reduce)'
/** Dash offset that hides a pathLength=1 stroke, caps included. */
const HIDDEN = 1.001

function reducedMotion(): boolean {
  try {
    return window.matchMedia(REDUCED).matches
  } catch {
    return false
  }
}

/**
 * Drafting lettering that writes itself stroke by stroke in graphite.
 * Either follows a progress value (the film: scroll writes, scroll back
 * erases) or plays once on cue (sections: written as they come into view).
 * Under reduced motion it is simply there.
 */
export function Lettering({
  text,
  size,
  weight = 1,
  maxWidth,
  progress,
  play,
  speed = 380,
  delay = 0,
  label,
  align = 'left',
  className,
  style,
}: LetteringProps) {
  const scale = size / CAP
  const laid = useMemo(
    () => layoutLettering(text, maxWidth === undefined ? Infinity : maxWidth / scale),
    [text, maxWidth, scale],
  )
  const paths = useRef<Array<SVGPathElement | null>>([])

  useEffect(() => {
    if (progress === undefined) return
    const els = paths.current
    const reduced = reducedMotion()
    const write = (v: number) => {
      const p = reduced ? 1 : v
      for (let i = 0; i < laid.strokes.length; i++) {
        const el = els[i]
        const s = laid.strokes[i]
        if (el === null || el === undefined || s === undefined) continue
        const span = Math.max(1e-6, s.end - s.start)
        const local = Math.min(1, Math.max(0, (p - s.start) / span))
        el.style.visibility = local > 0 ? 'visible' : 'hidden'
        el.style.strokeDashoffset = String(HIDDEN * (1 - local))
      }
    }
    write(progress.get())
    return progress.on('change', write)
  }, [progress, laid])

  const pad = weight / 2 + 1.2
  const vbX = -pad - 0.6
  const vbY = -pad - 1.2
  const vbW = laid.width + 2 * pad + 1.2
  const vbH = laid.height + 2 * pad + 3
  const timed = progress === undefined
  const reduced = timed && reducedMotion()
  const seconds = laid.duration / speed

  return (
    <span
      className={`lettering ${className ?? ''}`}
      style={{ display: 'block', textAlign: align, ...style }}
      data-written={timed && (play === true || reduced) ? 'true' : undefined}
    >
      {label !== undefined ? <span className="sr-only">{label}</span> : null}
      <svg
        aria-hidden="true"
        width={vbW * scale}
        height={vbH * scale}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className="lettering-ink inline-block overflow-visible"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={weight}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {laid.strokes.map((s, i) => {
            const timedStyle: CSSProperties | undefined = timed
              ? reduced
                ? undefined
                : play === true
                  ? {
                      strokeDasharray: '1 2',
                      strokeDashoffset: HIDDEN,
                      animation: `ag-write ${Math.max(0.02, (s.end - s.start) * seconds).toFixed(3)}s linear ${(delay + s.start * seconds).toFixed(3)}s both`,
                    }
                  : { strokeDasharray: '1 2', strokeDashoffset: HIDDEN }
              : { strokeDasharray: '1 2', strokeDashoffset: HIDDEN, visibility: 'hidden' }
            return (
              <path
                key={i}
                ref={(el) => {
                  paths.current[i] = el
                }}
                d={s.d}
                pathLength={1}
                // Pencil pressure: strokes vary a touch in density.
                opacity={0.82 + 0.14 * (((i * 37) % 11) / 10)}
                style={timedStyle}
              />
            )
          })}
        </g>
      </svg>
    </span>
  )
}
