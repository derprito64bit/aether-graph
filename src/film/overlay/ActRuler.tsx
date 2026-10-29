import { PlayIcon, StopIcon } from '@phosphor-icons/react'
import { motion, type MotionValue } from 'motion/react'
import { useSyncExternalStore } from 'react'
import { getAutopilot, subscribeAutopilot, toggleAutopilot } from '../../scroll/autopilot.ts'

const isPlaying = () => getAutopilot().playing
import { withBase } from '../../site.ts'
import type { ActDef, ActId } from '../key.ts'
import { ACTS } from '../timeline.ts'

/** Plain names for the acts, as the ruler and its links announce them. */
export const ACT_NAMES: Record<ActId, string> = {
  hero: 'Instrument',
  detail: 'Grip',
  exploded: 'Inside',
  xray: 'X-ray',
  mechanism: 'Clutch',
  reassembly: 'Serviceable',
  final: 'Finishes',
}

const MINOR_TICKS = Array.from({ length: 51 }, (_, i) => i / 50)

/**
 * Film position as a drafting scale: minor graduations every 2 percent,
 * a major mark at each act, and a cobalt rule that fills with progress.
 * The marks are real links (jump to that act); the active act is named.
 */
export function ActRuler({
  progress,
  active,
  onJump,
}: {
  progress: MotionValue<number>
  active: ActDef
  onJump: (act: ActDef) => void
}) {
  const playing = useSyncExternalStore(subscribeAutopilot, isPlaying, isPlaying)
  return (
    <nav
      aria-label="Film acts"
      className="pointer-events-auto absolute top-1/2 right-5 hidden h-[46svh] -translate-y-1/2 md:block lg:right-8"
    >
      <div className="relative h-full w-3">
        {MINOR_TICKS.map((t) => (
          <span
            key={t}
            aria-hidden="true"
            className="absolute right-0 h-px w-1.5 bg-(--color-rule)"
            style={{ top: `${t * 100}%` }}
          />
        ))}
        <span aria-hidden="true" className="absolute top-0 right-0 h-full w-px bg-(--color-rule)" />
        <motion.span
          aria-hidden="true"
          className="absolute top-0 right-0 h-full w-px origin-top bg-(--color-aether)"
          style={{ scaleY: progress }}
        />
        {ACTS.map((a, i) => {
          const on = a.id === active.id
          return (
            <a
              key={a.id}
              // A real deep link, so a copied or new-tab link opens on this act.
              href={withBase(`/?t=${a.start + 0.001}`)}
              aria-label={`Act ${i + 1}: ${ACT_NAMES[a.id]}`}
              aria-current={on ? 'step' : undefined}
              data-active={on}
              className="group absolute right-0 flex h-6 -translate-y-1/2 items-center gap-2"
              style={{ top: `${a.start * 100}%` }}
              onClick={(e) => {
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                e.preventDefault()
                onJump(a)
              }}
            >
              <span className="spec-tech whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[active=true]:text-(--color-ink) group-data-[active=true]:opacity-100">
                {ACT_NAMES[a.id]}
              </span>
              <span className="h-px w-3 bg-(--color-ink) transition-[width,background-color] duration-300 group-data-[active=true]:w-5 group-data-[active=true]:bg-(--color-aether)" />
            </a>
          )
        })}
      </div>
      <button
        type="button"
        data-autopilot-control
        // A toggle keeps one name; aria-pressed says whether it is on.
        aria-label="Autoplay"
        aria-pressed={playing}
        onClick={() => toggleAutopilot()}
        className="group absolute top-full right-0 mt-5 flex items-center gap-2 rounded-full py-1 pr-0.5 pl-2 text-(--color-dim) hover:text-(--color-ink)"
      >
        <span className="spec-tech text-inherit">{playing ? 'Stop' : 'Autoplay'}</span>
        <span className="grid size-6 place-items-center rounded-full border border-(--color-rule) transition-colors group-hover:border-(--color-ink)">
          {playing ? (
            <StopIcon size={10} weight="fill" aria-hidden="true" />
          ) : (
            <PlayIcon size={10} weight="fill" aria-hidden="true" />
          )}
        </span>
      </button>
    </nav>
  )
}
