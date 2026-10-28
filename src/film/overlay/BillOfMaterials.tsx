import { TEARDOWN_COPY } from '../chapters.ts'

/**
 * Parts list for the exploded assembly, numbered to match the balloons on
 * the drawing. The featured part's row is marked; the rest stay at full
 * contrast (state is never shown by dimming text).
 */
export function BillOfMaterials({ active }: { active: number }) {
  return (
    <section
      aria-label="Parts list"
      data-testid="bom"
      className="pointer-events-none absolute right-28 bottom-[9svh] hidden w-[19rem] md:block lg:right-36"
    >
      <h3 className="spec-tech text-(--color-ink)">Parts</h3>
      <ol className="mt-2 border-t border-(--color-border-hairline)">
        {TEARDOWN_COPY.map((part, i) => {
          const on = i === active
          return (
            <li
              key={part.key}
              data-active={on}
              aria-current={on ? 'step' : undefined}
              className="grid grid-cols-[2rem_1fr_auto] items-baseline gap-2 border-b border-(--color-border-hairline) py-[3px] font-mono text-[11.5px] text-(--color-dim) data-[active=true]:text-(--color-ink)"
            >
              <span className="tabular-nums" data-num>
                <span
                  className={`inline-grid size-[18px] place-items-center rounded-full ${
                    on ? 'bg-(--color-aether-strong) text-(--color-on-accent)' : ''
                  }`}
                >
                  {i + 1}
                </span>
              </span>
              <span>{part.kicker}</span>
              <span className="text-right">{part.material}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
