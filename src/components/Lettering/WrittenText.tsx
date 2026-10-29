import { Fragment, type CSSProperties } from 'react'

/** Seconds per character as the words are written in. */
const PER_CHAR = 0.026
/** Seconds the guide lines take to rule before the first word. */
const RULE = 0.42

/** When each word starts and how long it takes, in seconds after the cue. */
function wordTimings(text: string, delay = 0): Array<{ delay: number; dur: number }> {
  let chars = 0
  return text.split(' ').map((word, i) => {
    const t = {
      delay: delay + RULE + chars * PER_CHAR + i * 0.05,
      dur: 0.06 + word.length * PER_CHAR,
    }
    chars += word.length
    return t
  })
}

/**
 * Display text that is lettered rather than faded in. Pale blue guide
 * lines (a cap line and a baseline per line of text) are ruled first, the
 * words are written along them left to right, and then the guides are
 * erased, the way a draftsman letters a title. The guides ride a
 * transparent copy of the text, so they wrap exactly as the words do.
 * Plays when `play` turns true; static under reduced motion (CSS).
 */
export function WrittenText({
  text,
  play,
  delay = 0,
}: {
  text: string
  play: boolean
  delay?: number
}) {
  const words = text.split(' ')
  const timings = wordTimings(text, delay)
  const last = timings[timings.length - 1]
  const done = last === undefined ? delay : last.delay + last.dur
  const renderWords = (timed: boolean) =>
    words.map((word, i) => (
      <Fragment key={i}>
        <span
          className="written-word"
          style={
            timed
              ? ({
                  '--w-delay': `${timings[i]?.delay ?? 0}s`,
                  '--w-dur': `${timings[i]?.dur ?? 0.1}s`,
                } as CSSProperties)
              : undefined
          }
        >
          {word}
        </span>
        {i < words.length - 1 ? ' ' : null}
      </Fragment>
    ))
  return (
    <span className="written" data-play={play ? 'true' : 'false'}>
      <span className="sr-only">{text}</span>
      <span
        aria-hidden="true"
        className="written-guides"
        style={{ '--g-delay': `${delay}s`, '--g-erase': `${done + 0.35}s` } as CSSProperties}
      >
        <span className="written-line">{renderWords(false)}</span>
      </span>
      <span aria-hidden="true" className="written-ink">
        <span className="written-line">{renderWords(true)}</span>
      </span>
    </span>
  )
}
