import { useInView } from 'motion/react'
import { useRef } from 'react'
import { useRevealed } from '../../loader/useRevealed.ts'
import { WrittenText } from './WrittenText.tsx'

/**
 * A section title that letters itself the first time it is properly in
 * view (and never behind the loading page).
 */
export function WrittenHeading({
  as: Tag = 'h2',
  text,
  id,
  className,
  delay,
}: {
  as?: 'h1' | 'h2' | 'h3'
  text: string
  id?: string
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLHeadingElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const revealed = useRevealed()
  return (
    <Tag ref={ref} id={id} className={className}>
      <WrittenText text={text} play={inView && revealed} delay={delay} />
    </Tag>
  )
}
