import { StopIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import {
  getAutopilot,
  onAutopilotFrame,
  stopAutopilot,
  subscribeAutopilot,
} from '../../scroll/autopilot.ts'

/**
 * The autopilot's control while it plays: what is on screen, how far the
 * tour has come, and a stop button. Any scroll or key stops it too. Leaves
 * with the page (the tour only exists on the home route).
 */
export function AutopilotControl() {
  const state = useSyncExternalStore(subscribeAutopilot, getAutopilot, getAutopilot)
  const bar = useRef<HTMLSpanElement>(null)

  useEffect(
    () =>
      onAutopilotFrame((fraction) => {
        if (bar.current !== null) bar.current.style.transform = `scaleX(${fraction})`
      }),
    [],
  )
  useEffect(() => () => stopAutopilot(), [])

  return (
    <AnimatePresence>
      {state.playing ? (
        <motion.div
          key="autopilot"
          data-autopilot-control
          data-testid="autopilot"
          role="group"
          aria-label="Autoplay"
          className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        >
          <div className="relative flex items-center gap-3 overflow-hidden rounded-full border border-(--color-rule) bg-(--color-night)/92 py-1.5 pr-1.5 pl-4 shadow-[0_10px_30px_-12px_rgba(17,19,22,0.35)] backdrop-blur-md">
            <span className="spec-tech whitespace-nowrap text-(--color-dim)">
              Autoplay
              <span className="mx-1.5 text-(--color-rule)">/</span>
              <span className="text-(--color-ink)">{state.label}</span>
            </span>
            <button
              type="button"
              className="btn btn-ink min-h-9 px-3.5 text-sm"
              onClick={() => stopAutopilot()}
            >
              <StopIcon size={14} weight="fill" aria-hidden="true" />
              Stop
            </button>
            <span
              aria-hidden="true"
              ref={bar}
              className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-(--color-aether)"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
