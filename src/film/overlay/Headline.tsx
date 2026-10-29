import { WrittenText } from '../../components/Lettering/WrittenText.tsx'
import { useRevealed } from '../../loader/useRevealed.ts'

/**
 * Chapter headline, lettered: guide lines ruled, the words written along
 * them in reading order, the guides erased. Each chapter mounts fresh, so
 * every act letters its own title. Screen readers get the sentence once.
 */
export function Headline({
  children,
  size = 'lg',
}: {
  children: string
  size?: 'xl' | 'lg' | 'md'
}) {
  // Never behind the loading page: the hero would letter itself unseen.
  const revealed = useRevealed()
  return (
    <h2 className={`spec-num display-${size} mt-4`}>
      <WrittenText text={children} play={revealed} delay={0.08} />
    </h2>
  )
}
