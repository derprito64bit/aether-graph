import { motion, useInView, useReducedMotion } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { PENCIL } from '../../data/pencil.ts'
import { useRevealed } from '../../loader/useRevealed.ts'
import { SHAFT_R, ST } from '../PencilViewer/pencilDimensions.ts'
import {
  BARREL_TOP,
  CROWN,
  GRIP_TOP,
  JOINTS,
  NOSE_BASE,
  R,
  RING_TOP,
  SLEEVE_BASE,
  SLEEVE_MOUTH,
  TIP,
  clipPath,
  mm,
  outlinePath,
} from './pencilProfile.ts'

const OUTLINE = outlinePath()
const CLIP = clipPath()

/** Which part of the drawing the surrounding copy is talking about. */
export type DrawingFocus = 'balance' | 'tolerance' | 'grip' | null

interface TechnicalDrawingProps {
  focus?: DrawingFocus
  title: string
  className?: string
}

const SHAFT = { from: mm(ST.shaftBase) + 2, to: mm(ST.shaftTop), r: mm(SHAFT_R) }
const SPRING = { from: mm(ST.springBase), to: mm(ST.springTop), r: 2.7 }
const CLUTCH = { from: 15.2, to: NOSE_BASE + 1, rTip: 1.0, rBase: 2.3 }
const BALANCE_X = PENCIL.balanceFromTipMm

/** Dimension line with ticks, extension lines, and a knocked-out label. */
/** Dimension lines draw out from their midpoint; arrows and labels follow. */
const DRAW = {
  hidden: { pathLength: 0 },
  shown: { pathLength: 1, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const } },
}
const LATE = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.3, delay: 0.22 } },
}
const STEP = { hidden: {}, shown: {} }

function Dim({
  x1,
  x2,
  y,
  from,
  label,
  className,
}: {
  x1: number
  x2: number
  y: number
  /** Y where the extension lines start (the object edge). */
  from: number
  label: string
  className?: string
}) {
  const dir = y < from ? -1 : 1
  const mid = (x1 + x2) / 2
  const w = label.length * 1.55 + 1.2
  return (
    <motion.g className={`dwg-dim ${className ?? ''}`} variants={STEP}>
      <motion.line x1={x1} y1={from + dir * 0.8} x2={x1} y2={y + dir * 1.6} variants={LATE} />
      <motion.line x1={x2} y1={from + dir * 0.8} x2={x2} y2={y + dir * 1.6} variants={LATE} />
      <motion.line x1={mid} y1={y} x2={x1} y2={y} variants={DRAW} />
      <motion.line x1={mid} y1={y} x2={x2} y2={y} variants={DRAW} />
      <motion.path
        d={`M${x1},${y} l1.8,-0.6 v1.2 Z M${x2},${y} l-1.8,-0.6 v1.2 Z`}
        className="dwg-arrow"
        variants={LATE}
      />
      <motion.rect
        x={mid - w / 2}
        y={y - 1.7}
        width={w}
        height={3.4}
        className="dwg-knock"
        variants={LATE}
      />
      <motion.text x={mid} y={y + 0.95} textAnchor="middle" className="dwg-label" variants={LATE}>
        {label}
      </motion.text>
    </motion.g>
  )
}

/** Leader with an elbow and a left- or right-anchored note. */
function Leader({
  from,
  to,
  label,
  anchor,
  className,
}: {
  from: [number, number]
  to: [number, number]
  label: string
  anchor: 'start' | 'end'
  className?: string
}) {
  const run = anchor === 'start' ? 4 : -4
  return (
    <g className={`dwg-dim dwg-leader ${className ?? ''}`}>
      <circle cx={from[0]} cy={from[1]} r={0.45} className="dwg-arrow" />
      <polyline points={`${from[0]},${from[1]} ${to[0]},${to[1]} ${to[0] + run},${to[1]}`} />
      <text
        x={to[0] + run + (anchor === 'start' ? 1 : -1)}
        y={to[1] + 0.95}
        textAnchor={anchor}
        className="dwg-label"
      >
        {label}
      </text>
    </g>
  )
}

function Group({
  id,
  focus,
  children,
}: {
  id: Exclude<DrawingFocus, null> | 'base'
  focus: DrawingFocus
  children: ReactNode
}) {
  const state = focus === null ? 'idle' : focus === id ? 'on' : 'off'
  return (
    <g className="dwg-group" data-state={state}>
      {children}
    </g>
  )
}

/**
 * Dimensioned side elevation of the pencil, generated from the same
 * dimensions file as the 3D model, so the drawing can never disagree with
 * the render. Hidden lines (dashed) show the shaft, clutch, and spring.
 * The outline draws itself once on first view; reduced motion shows it
 * finished. `focus` lifts one region and recedes the rest.
 */
export function TechnicalDrawing({ focus = null, title, className }: TechnicalDrawingProps) {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.35 })
  const reduced = useReducedMotion() === true
  const revealed = useRevealed()
  // Drawn once seen, and never behind the loading page.
  const drawn = reduced || (inView && revealed)

  const knurl: string[] = []
  for (let x = NOSE_BASE - 9; x < GRIP_TOP + 9; x += 1.2) {
    knurl.push(`M${x},${-R} l9,${2 * R}`, `M${x + 9},${-R} l-9,${2 * R}`)
  }

  const springCoils: string[] = []
  const coils = 9
  const pitch = (SPRING.to - SPRING.from) / coils
  for (let i = 0; i < coils; i++) {
    const x = SPRING.from + i * pitch
    springCoils.push(`M${x},${-SPRING.r} L${x + pitch / 2},${SPRING.r} L${x + pitch},${-SPRING.r}`)
  }

  return (
    <svg
      ref={ref}
      viewBox="-8 -25 168 51"
      role="img"
      aria-label={title}
      className={`technical-drawing h-auto w-full ${className ?? ''}`}
      data-focus={focus ?? 'none'}
      data-testid="technical-drawing"
    >
      <defs>
        <pattern id="dwg-grid" width="5" height="5" patternUnits="userSpaceOnUse" x="0" y="0">
          <path d="M5,0 L0,0 L0,5" className="dwg-grid-line" />
        </pattern>
        <clipPath id="dwg-grip-clip">
          <rect x={NOSE_BASE} y={-R} width={GRIP_TOP - NOSE_BASE} height={2 * R} />
        </clipPath>
      </defs>
      <rect x="-8" y="-25" width="168" height="51" fill="url(#dwg-grid)" />

      {/* Centre line: long-short chain, the drafting convention for an axis. */}
      <line x1={-5} y1={0} x2={CROWN + 5} y2={0} className="dwg-center" />

      <Group id="base" focus={focus}>
        <motion.path
          d={OUTLINE}
          className="dwg-outline"
          initial={reduced ? false : { pathLength: 0 }}
          animate={drawn ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
        />
        <rect
          x={TIP}
          y={-0.25}
          width={SLEEVE_MOUTH - TIP + 0.4}
          height={0.5}
          className="dwg-lead"
        />
        {JOINTS.map(([x, r]) => (
          <line key={x} x1={x} y1={-r} x2={x} y2={r} className="dwg-thin" />
        ))}
        {/* Pocket clip: bead at the front, hinge into the cap at the rear. */}
        <path d={CLIP} className="dwg-thin dwg-fill" />
        <line x1={SHAFT.from} y1={-SHAFT.r} x2={SHAFT.to} y2={-SHAFT.r} className="dwg-hidden" />
        <line x1={SHAFT.from} y1={SHAFT.r} x2={SHAFT.to} y2={SHAFT.r} className="dwg-hidden" />
        <path d={springCoils.join(' ')} className="dwg-spring" />
      </Group>

      <Group id="grip" focus={focus}>
        <path d={knurl.join(' ')} clipPath="url(#dwg-grip-clip)" className="dwg-knurl" />
        <Leader
          from={[34.6, R - 1]}
          to={[40, 18.5]}
          label={`Knurl ${PENCIL.knurlPitchMm} × ${PENCIL.knurlDepthMm}`}
          anchor="start"
          className="dwg-minor"
        />
      </Group>

      <Group id="tolerance" focus={focus}>
        <path
          d={`M${CLUTCH.from},${-CLUTCH.rTip} L${CLUTCH.to},${-CLUTCH.rBase} M${CLUTCH.from},${CLUTCH.rTip} L${CLUTCH.to},${CLUTCH.rBase} M${CLUTCH.to},${-CLUTCH.rBase} L${CLUTCH.to},${CLUTCH.rBase}`}
          className="dwg-hidden dwg-clutch"
        />
        <Leader
          from={[CLUTCH.from + 3, -1.4]}
          to={[27, -19.5]}
          label={`Clutch ${PENCIL.clutchJaws} jaws ±${PENCIL.clutchToleranceMm}`}
          anchor="start"
          className="dwg-minor"
        />
      </Group>

      <Group id="balance" focus={focus}>
        <g transform={`translate(${BALANCE_X} 0)`} className="dwg-cg">
          <circle r={1.7} className="dwg-thin dwg-paper" />
          <path d="M0,0 L1.7,0 A1.7,1.7 0 0 1 0,1.7 Z M0,0 L-1.7,0 A1.7,1.7 0 0 1 0,-1.7 Z" />
        </g>
        <Dim
          x1={TIP}
          x2={BALANCE_X}
          y={10}
          from={0}
          label={String(BALANCE_X)}
          className="dwg-minor"
        />
      </Group>

      <motion.g
        className="dwg-dims"
        variants={{
          hidden: {},
          shown: { transition: { staggerChildren: 0.11, delayChildren: reduced ? 0 : 1.05 } },
        }}
        initial={reduced ? false : 'hidden'}
        animate={drawn ? 'shown' : 'hidden'}
      >
        <Dim
          x1={SLEEVE_MOUTH}
          x2={SLEEVE_BASE}
          y={-12}
          from={-R + 3.4}
          label={String(PENCIL.sleeveLengthMm)}
          className="dwg-minor"
        />
        <Dim x1={SLEEVE_BASE} x2={NOSE_BASE} y={-12} from={-R} label={String(PENCIL.noseConeMm)} />
        <Dim x1={NOSE_BASE} x2={GRIP_TOP} y={-12} from={-R} label={String(PENCIL.gripLengthMm)} />
        <Dim
          x1={RING_TOP}
          x2={BARREL_TOP}
          y={-12}
          from={-R - 2}
          label={String(PENCIL.barrelTubeMm)}
        />
        <Dim x1={TIP} x2={CROWN} y={15} from={0} label={String(PENCIL.lengthMm)} />
        <motion.g className="dwg-dim" variants={LATE}>
          <line x1={BARREL_TOP} y1={-R} x2={CROWN + 9.5} y2={-R} />
          <line x1={BARREL_TOP} y1={R} x2={CROWN + 9.5} y2={R} />
          <line x1={CROWN + 8} y1={-R} x2={CROWN + 8} y2={R} />
          <path
            d={`M${CROWN + 8},${-R} l-0.6,1.8 h1.2 Z M${CROWN + 8},${R} l-0.6,-1.8 h1.2 Z`}
            className="dwg-arrow"
          />
          <text x={CROWN + 9.6} y={0.95} className="dwg-label">
            Ø{PENCIL.barrelDiamMm}
          </text>
        </motion.g>
      </motion.g>
      <style>{DRAWING_CSS}</style>
    </svg>
  )
}

const DRAWING_CSS = `
.technical-drawing { overflow: visible; }
.technical-drawing .dwg-grid-line { fill: none; stroke: var(--color-border-hairline); stroke-width: 0.06; }
.technical-drawing .dwg-center { stroke: var(--color-faint); stroke-width: 0.1; stroke-dasharray: 6 1.2 1 1.2; }
.technical-drawing .dwg-outline { fill: var(--color-night); stroke: var(--color-ink); stroke-width: 0.26; stroke-linejoin: round; }
.technical-drawing .dwg-thin { fill: none; stroke: var(--color-ink); stroke-width: 0.14; }
.technical-drawing .dwg-fill { fill: var(--color-night); }
.technical-drawing .dwg-paper { fill: var(--color-night); }
.technical-drawing .dwg-lead { fill: var(--color-ink); }
.technical-drawing .dwg-hidden { fill: none; stroke: var(--color-dim); stroke-width: 0.12; stroke-dasharray: 0.9 0.6; }
.technical-drawing .dwg-spring { fill: none; stroke: var(--color-faint); stroke-width: 0.09; stroke-linejoin: round; }
.technical-drawing .dwg-knurl { fill: none; stroke: var(--color-dim); stroke-width: 0.08; }
.technical-drawing .dwg-cg path { fill: var(--color-ink); }
.technical-drawing .dwg-dim line, .technical-drawing .dwg-dim polyline { fill: none; stroke: var(--color-aether); stroke-width: 0.1; }
.technical-drawing .dwg-arrow { fill: var(--color-aether); stroke: none; }
.technical-drawing .dwg-knock { fill: var(--color-night); }
.technical-drawing .dwg-label { font-family: var(--font-mono); font-size: 2.3px; fill: var(--color-aether-deep); letter-spacing: 0; }
.technical-drawing .dwg-group { transition: opacity 0.45s var(--ease-out-quint); }
.technical-drawing[data-focus]:not([data-focus='none']) .dwg-group[data-state='off'] .dwg-minor { opacity: 0.18; }
.technical-drawing .dwg-group[data-state='on'] .dwg-hidden,
.technical-drawing .dwg-group[data-state='on'] .dwg-knurl,
.technical-drawing .dwg-group[data-state='on'] .dwg-clutch { stroke: var(--color-aether); stroke-width: 0.2; }
.technical-drawing .dwg-group[data-state='on'] .dwg-cg path { fill: var(--color-aether); }
.technical-drawing .dwg-group[data-state='on'] .dwg-cg circle { stroke: var(--color-aether); stroke-width: 0.24; }
@media (max-width: 767px) {
  .technical-drawing .dwg-label { font-size: 4.4px; }
  .technical-drawing .dwg-minor { display: none; }
  .technical-drawing .dwg-knock { transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .technical-drawing .dwg-group { transition: none; }
}
`
