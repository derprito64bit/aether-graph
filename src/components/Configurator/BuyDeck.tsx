import { LEAD_OPTIONS, PENCIL_FINISHES, pencilPrice } from '../../data/pencil.ts'
import { formatPrice } from '../../lib/format.ts'
import { Glass } from '../Glass/Glass.tsx'
import { PENCIL_FINISH_PARAMS } from '../PencilViewer/pencilMaterials.ts'
import { PencilConfigProvider, usePencilConfig } from '../PencilViewer/PencilConfig.tsx'
import { PencilViewer } from '../PencilViewer/PencilViewer.tsx'

/**
 * Closing configurator deck. Finish and lead lerp the live 3D materials
 * through shared config; the sticky summary bar carries price and CTA.
 */
export function BuyDeck() {
  return (
    <PencilConfigProvider>
      <BuyDeckInner />
    </PencilConfigProvider>
  )
}

function BuyDeckInner() {
  const { finish, setFinish, leadId, setLeadId } = usePencilConfig()
  const option = LEAD_OPTIONS.find((l) => l.id === leadId) ?? LEAD_OPTIONS[0]
  const active = PENCIL_FINISHES.find((f) => f.id === finish) ?? PENCIL_FINISHES[0]
  if (option === undefined || active === undefined) return null
  const accent = PENCIL_FINISH_PARAMS[finish]?.uiAccent ?? '#c9a06a'
  const price = pencilPrice(finish, option.id)

  return (
    <section
      id="buy"
      tabIndex={-1}
      aria-label="Configure your Aether Graph 0.5"
      className="mx-auto max-w-6xl px-4 py-16"
    >
      <Glass variant="panel" label="Configurator">
        <div className="grid gap-8 p-8 md:grid-cols-2 md:p-12">
          <div>
            <PencilViewer label={`Aether Graph 0.5 in ${active.name}`} sharedConfig />
          </div>
          <div>
            <p className="kicker">Configure</p>
            <h2 className="spec-num mt-3 text-4xl md:text-5xl">Make it yours.</h2>
            <h3 className="spec-tech mt-6">Finish</h3>
            <div role="group" aria-label="Choose a finish" className="mt-2 flex gap-3">
              {PENCIL_FINISHES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFinish(f.id)}
                  aria-pressed={finish === f.id}
                  aria-label={f.name}
                  title={`${f.name}: ${f.tagline}`}
                  data-testid={`finish-${f.id}`}
                  data-active={finish === f.id}
                  className="h-12 w-12 rounded-full border-2 border-transparent"
                  style={{
                    background: f.swatch,
                    borderColor: finish === f.id ? accent : 'transparent',
                  }}
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-(--color-dim)" data-testid="finish-name">
              {active.name}: {active.tagline}
            </p>
            <span
              aria-hidden="true"
              data-testid="finish-underline"
              className="mt-1 block h-0.5 w-16 rounded-full"
              style={{ background: accent }}
            />
            <h3 className="spec-tech mt-6">Lead</h3>
            <div
              role="group"
              aria-label="Choose a lead diameter"
              className="mt-2 flex flex-wrap gap-2"
            >
              {LEAD_OPTIONS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLeadId(l.id)}
                  aria-pressed={leadId === l.id}
                  data-testid={`lead-${l.id}`}
                  data-active={leadId === l.id}
                  className="min-h-11 rounded-full border border-(--color-border-hairline) px-5 text-sm text-(--color-dim) data-[active=true]:bg-(--color-elev) data-[active=true]:text-(--color-ink)"
                >
                  {l.label} · {l.grades}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="sticky bottom-4 mx-8 mb-8 flex items-center justify-between rounded-full border border-(--color-border-hairline) bg-(--color-scrim) px-6 py-3 backdrop-blur-md md:mx-12">
          <p className="text-sm text-(--color-dim)">
            {active.name} · {option.label}
          </p>
          <p className="flex items-center gap-4">
            <span className="spec-num text-2xl" data-testid="buy-price">
              {formatPrice(price)}
            </span>
            <span className="rounded-full bg-(--color-aether-strong) px-5 py-2 text-sm font-semibold text-black">
              Buy
            </span>
          </p>
        </div>
      </Glass>
    </section>
  )
}
