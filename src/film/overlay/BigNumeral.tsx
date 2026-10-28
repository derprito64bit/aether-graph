import { useCountUp } from '../../hooks/useCountUp.ts'
import { formatCount } from '../../lib/format.ts'
import type { ChapterNumeral } from '../chapters.ts'

/**
 * Big display numeral with a count-up on chapter entry. The count keeps the
 * authored decimal places, so 0.4 counts 0.0 to 0.4 instead of rounding to
 * 0. Non-numeric values render static.
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
    Number.isFinite(digits) && digits !== 0 ? formatCount(animated, numeral.value) : numeral.value
  return (
    <p className="mt-6 flex items-end gap-3" aria-label={`${numeral.value} ${numeral.unit}`}>
      <span className="spec-num spec-num--stat" aria-hidden="true">
        {text}
      </span>
      <span className="spec-unit pb-2" aria-hidden="true">
        {numeral.unit}
      </span>
    </p>
  )
}
