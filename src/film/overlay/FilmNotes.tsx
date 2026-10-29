import { useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { Lettering } from '../../components/Lettering/Lettering.tsx'
import { onRevealed } from '../../loader/loader.ts'
import { FILM_NOTES, noteWritten, type FilmNote } from '../notes.ts'
import { calloutBridge } from './callouts.ts'

/** The text takes the first 72% of a note's ink, the leader the rest. */
const TEXT_SHARE = 0.72
const LEADER_FROM = 0.55
/** Hero notes letter themselves on arrival, this long after the reveal. */
const HERO_START = 1.3
const HERO_STEP = 0.75
const HERO_SECONDS = 1.1
/** The hero's notes fade as the render front takes over the sketch. */
const HERO_FADE_FROM = 0.05
const HERO_FADE_SPAN = 0.045
const SHOULDER = 16
const GAP = 8
const CAP_PX = 12

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** Each hero note's turn (0, 1, 2), worked out once rather than per frame. */
const HERO_ORDER = new Map(
  FILM_NOTES.filter((n) => n.act === 'hero').map((n, i) => [n.id, i] as const),
)
const heroIndex = (note: FilmNote) => HERO_ORDER.get(note.id) ?? 0
const LEADER_OPACITY = 0.75

/** Shared clock for the hero notes: seconds since the loading page left. */
const heroClock = { revealedAt: -1 }

function Note({ note, progress }: { note: FilmNote; progress: MotionValue<number> }) {
  const hero = note.act === 'hero'
  const written = useTransform(progress, (p) => clamp01(noteWritten(note, p) / TEXT_SHARE))
  const fade = useTransform(progress, (p) =>
    hero ? 1 - clamp01((p - HERO_FADE_FROM) / HERO_FADE_SPAN) : 1,
  )
  const timed = useMotionValue(0)
  // Hero notes write on a clock after the reveal, in turn, then hold.
  useEffect(() => {
    if (!hero) return
    let raf = 0
    const start = HERO_START + heroIndex(note) * HERO_STEP
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (heroClock.revealedAt < 0) return
      const t = (performance.now() - heroClock.revealedAt) / 1000 - start
      timed.set(clamp01(t / HERO_SECONDS))
      if (t > HERO_SECONDS) cancelAnimationFrame(raf)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [hero, note, timed])

  const left = note.side === 'left'
  return (
    <div
      className="film-note absolute"
      data-note={note.id}
      style={{
        left: `${note.x * 100}%`,
        top: `${note.y * 100}%`,
        transform: `translate(${left ? `calc(-100% - ${GAP + SHOULDER}px)` : `${GAP + SHOULDER}px`}, -50%)`,
      }}
    >
      <FadeBox value={fade}>
        <Lettering
          text={note.text}
          size={CAP_PX}
          weight={1.1}
          maxWidth={230}
          align={left ? 'right' : 'left'}
          progress={hero ? timed : written}
        />
      </FadeBox>
    </div>
  )
}

function FadeBox({ value, children }: { value: MotionValue<number>; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const apply = (v: number) => {
      if (ref.current !== null) ref.current.style.opacity = String(v)
    }
    apply(value.get())
    return value.on('change', apply)
  }, [value])
  return <div ref={ref}>{children}</div>
}

/**
 * The film annotated in pencil: margin notes in drafting lettering with
 * leaders to the parts they name. Leaders are projected from the 3D anchors
 * every frame and written straight to the DOM. Desktop only: on a phone
 * the frame has no margin to write in.
 */
export function FilmNotes({ progress }: { progress: MotionValue<number> }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const leaderRefs = useRef<Array<SVGPathElement | null>>([])
  const dotRefs = useRef<Array<SVGCircleElement | null>>([])

  useEffect(() => {
    onRevealed(() => {
      heroClock.revealedAt = performance.now()
    })
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (root === null) return
    const v = new THREE.Vector3()
    let raf = 0
    let width = root.clientWidth
    let height = root.clientHeight
    const resize = new ResizeObserver(() => {
      width = root.clientWidth
      height = root.clientHeight
    })
    resize.observe(root)
    // Only while the film is on screen (and laid out: the layer is hidden
    // below lg). Visibility is written only when it changes.
    let onScreen = true
    const seen = new IntersectionObserver((entries) => {
      for (const entry of entries) onScreen = entry.isIntersecting
    })
    seen.observe(root)
    const leaderShown: boolean[] = FILM_NOTES.map(() => false)
    const dotShown: boolean[] = FILM_NOTES.map(() => false)
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const camera = calloutBridge.camera
      if (camera === null || width === 0 || !onScreen) return
      const p = progress.get()
      const now = performance.now()
      for (let i = 0; i < FILM_NOTES.length; i++) {
        const note = FILM_NOTES[i]
        const path = leaderRefs.current[i]
        const dot = dotRefs.current[i]
        if (note === undefined || path === null || path === undefined) continue
        let f: number
        if (note.act === 'hero') {
          const fade = 1 - clamp01((p - HERO_FADE_FROM) / HERO_FADE_SPAN)
          if (fade > 0) {
            const t =
              heroClock.revealedAt < 0
                ? 0
                : (now - heroClock.revealedAt) / 1000 - HERO_START - heroIndex(note) * HERO_STEP
            f = clamp01((t / HERO_SECONDS - 0.85) / 0.6)
            path.style.opacity = String(LEADER_OPACITY * fade)
            if (dot !== null && dot !== undefined) dot.style.opacity = String(fade)
          } else {
            f = 0
          }
        } else {
          f = clamp01((noteWritten(note, p) - LEADER_FROM) / (1 - LEADER_FROM))
        }
        let shown = false
        let ax = 0
        let ay = 0
        if (f > 0.001) {
          v.copy(calloutBridge.notes[note.anchor]).project(camera)
          ax = ((v.x + 1) / 2) * width
          ay = ((1 - v.y) / 2) * height
          // A leader never runs out of frame: an anchor the shot has cropped
          // (or one behind the camera) gets no leader at all.
          shown = v.z < 1 && ax > 8 && ax < width - 8 && ay > 8 && ay < height - 8
        }
        if (leaderShown[i] !== shown) {
          leaderShown[i] = shown
          path.style.visibility = shown ? 'visible' : 'hidden'
        }
        const dotOn = shown && f > 0.97
        if (dot !== null && dot !== undefined && dotShown[i] !== dotOn) {
          dotShown[i] = dotOn
          dot.style.visibility = dotOn ? 'visible' : 'hidden'
        }
        if (!shown) continue
        const dir = note.side === 'left' ? 1 : -1
        const sx = note.x * width - dir * (SHOULDER + GAP * 0.5)
        const sy = note.y * height
        const kx = note.x * width
        path.setAttribute('d', `M${sx} ${sy}L${kx} ${sy}L${ax} ${ay}`)
        path.style.strokeDashoffset = String(1.001 * (1 - f))
        if (dot !== null && dot !== undefined) {
          dot.setAttribute('cx', String(ax))
          dot.setAttribute('cy', String(ay))
        }
      }
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      resize.disconnect()
      seen.disconnect()
    }
  }, [progress])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-testid="film-notes"
      className="pointer-events-none absolute inset-0 hidden lg:block"
    >
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {FILM_NOTES.map((note, i) => (
          <g key={note.id} className="film-leader">
            <path
              ref={(el) => {
                leaderRefs.current[i] = el
              }}
              pathLength={1}
              fill="none"
              stroke="var(--color-graphite)"
              strokeWidth={1}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={LEADER_OPACITY}
              style={{ strokeDasharray: '1 2', strokeDashoffset: 1.001, visibility: 'hidden' }}
            />
            <circle
              ref={(el) => {
                dotRefs.current[i] = el
              }}
              r={2.2}
              fill="var(--color-graphite)"
              style={{ visibility: 'hidden' }}
            />
          </g>
        ))}
      </svg>
      {FILM_NOTES.map((note) => (
        <Note key={note.id} note={note} progress={progress} />
      ))}
    </div>
  )
}
