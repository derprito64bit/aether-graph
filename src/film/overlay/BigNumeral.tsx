import { useCountUp } from '../../hooks/useCountUp.ts'
import type { ChapterNumeral } from '../chapters.ts'

/**
 * Big display numeral with a count-up on chapter entry. Non-numeric values
 * (e.g. "12,480") parse to their digits; anything unparsable renders static.
 */
export function BigNumeral({
  numeral,
  active = true,
}: {
  numeral: ChapterNumeral
  active?: boolean
}) {
  const digits = Number(numeral.value.replace(/[^0-9.]/g, ''))
  const animated = useCountUp(Number.isFinite(digits) ? digits : 0, active)
  const text =
    Number.isFinite(digits) && digits !== 0
      ? Math.round(animated).toLocaleString('en-US')
      : numeral.value
  return (
    <p className="mt-4">
      <span className="spec-num spec-num--stat">{text}</span>{' '}
      <span className="spec-unit">{numeral.unit}</span>
    </p>
  )
}
