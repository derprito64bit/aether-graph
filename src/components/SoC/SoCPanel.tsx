import { useState } from 'react'
import { PERFORMANCE, type SoCKey } from '../../data/product.ts'
import { formatNumber } from '../../lib/format.ts'

const ORDER: SoCKey[] = ['cpu', 'gpu', 'npu']

/**
 * A1 Ultra die panel. dataviz applied: each tab is a single series, so no
 * categorical palette ships — one sequential hue (aether) for magnitude,
 * ink tokens for all text, direct value labels beside every bar, thin
 * 4px-rounded marks with a surface gap. The metric list doubles as the
 * table view, so identity is never color-alone.
 */
export function SoCPanel() {
  const [tab, setTab] = useState<SoCKey>('cpu')
  const unit = PERFORMANCE[tab]
  return (
    <section aria-label="A1 Ultra performance" className="mx-auto max-w-6xl px-4 py-12">
      <div role="tablist" aria-label="Processor units" className="flex gap-2">
        {ORDER.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            aria-controls={`soc-panel-${k}`}
            id={`soc-tab-${k}`}
            onClick={() => setTab(k)}
            data-active={tab === k}
            className="rounded-full border border-(--color-border-hairline) px-4 py-2 text-sm text-(--color-dim) data-[active=true]:bg-(--color-elev) data-[active=true]:text-(--color-ink)"
          >
            {PERFORMANCE[k].name}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`soc-panel-${tab}`}
        aria-labelledby={`soc-tab-${tab}`}
        className="mt-8"
      >
        <p className="kicker">{unit.name}</p>
        <p className="spec-num mt-2 text-6xl md:text-7xl" data-testid="soc-hero">
          {formatNumber(unit.hero.value)}
          <span className="spec-unit ml-2">{unit.hero.suffix}</span>
        </p>
        <p className="mt-2 text-(--color-dim)">{unit.headline}</p>
        <ul className="mt-6 space-y-4">
          {unit.metrics.map((m) => (
            <li key={m.label}>
              <p className="flex justify-between text-sm">
                <span className="text-(--color-ink)">{m.label}</span>
                <span className="text-(--color-dim)" data-testid={`soc-metric-${unit.key}`}>
                  {m.value} {m.suffix} · max {m.max}
                </span>
              </p>
              <div
                role="img"
                aria-label={`${m.label}: ${m.value} of ${m.max} ${m.suffix}`}
                className="mt-1 h-2 overflow-hidden rounded-full bg-(--color-elev)"
              >
                <div
                  className="h-full rounded-full bg-(--color-aether)"
                  style={{ width: `${Math.min(100, (m.value / m.max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="spec-tech mt-6">{unit.footnote}</p>
      </div>
    </section>
  )
}
