import { motion } from 'motion/react'

const WORD = {
  hidden: { y: '108%' },
  shown: { y: '0%', transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] as const } },
}

/**
 * Chapter headline. Words rise out of a mask in sequence: the reading order
 * is the reveal order. Screen readers get the sentence once, as plain text;
 * the animated words are presentation only. The parent sets the stagger.
 */
export function Headline({ children, size = 'lg' }: { children: string; size?: 'xl' | 'lg' }) {
  const words = children.split(' ')
  return (
    <h2 className={`spec-num ${size === 'xl' ? 'display-xl' : 'display-lg'} mt-4`}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom"
          >
            <motion.span className="inline-block" variants={WORD}>
              {word}
            </motion.span>
            {i < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    </h2>
  )
}
