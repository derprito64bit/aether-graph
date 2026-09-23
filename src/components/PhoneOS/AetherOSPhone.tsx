import { useState } from 'react'
import { OS_APPS, PHONE_INTERACTION_COPY, type AppId } from '../../data/software.ts'

type Screen = { name: 'home' } | { name: 'app'; app: AppId } | { name: 'shade' }

const APP_BODY: Record<AppId, string> = {
  camera: 'Five focal lengths. Tap the shutter, keep the photo.',
  photos: 'Cleanup runs on-device. Nothing uploads to fix a picture.',
  messages: 'Summaries are written locally. No server reads along.',
  weather: 'Glanceable. Quiet. Correct.',
  music: 'Lossless over Wi-Fi 7, cached for offline.',
  maps: 'Offline regions included. The blue dot stays yours.',
  timer: 'Haptics, not noise.',
  settings: 'Every toggle explained in one line.',
}

/**
 * Interactive AetherOS phone. Home grid of eight apps, app screens,
 * notification shade, and quick-settings toggles. Every control is a real
 * button with a 44px target; toggles carry aria-pressed.
 */
export function AetherOSPhone() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [notifications, setNotifications] = useState<string[]>([
    'Photos finished local cleanup',
    'Transcript ready, offline',
  ])
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    wifi: true,
    bluetooth: false,
    dnd: false,
    flashlight: false,
  })

  const dismiss = (note: string) => setNotifications((ns) => ns.filter((n) => n !== note))
  const flip = (k: string) => setToggles((t) => ({ ...t, [k]: !t[k] }))

  return (
    <section aria-label="AetherOS simulator" className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex justify-center">
          <div
            data-testid="os-phone"
            className="w-[280px] rounded-[36px] border border-(--color-border-hairline) bg-black p-3"
          >
            <div className="flex h-11 items-center justify-between px-3">
              <span className="spec-tech on-dark">9:41</span>
              <button
                type="button"
                aria-label={screen.name === 'shade' ? 'Close notifications' : 'Open notifications'}
                aria-expanded={screen.name === 'shade'}
                onClick={() =>
                  setScreen((s) => (s.name === 'shade' ? { name: 'home' } : { name: 'shade' }))
                }
                data-testid="os-shade-toggle"
                className="spec-tech on-dark min-h-11 min-w-11 rounded-full px-2"
              >
                {notifications.length > 0 ? `${notifications.length} new` : 'Clear'}
              </button>
            </div>
            <div className="min-h-[420px] rounded-[26px] bg-(--color-surface) p-4">
              {screen.name === 'home' && (
                <ul aria-label="Apps" className="grid grid-cols-4 gap-3">
                  {OS_APPS.map((app) => (
                    <li key={app.id}>
                      <button
                        type="button"
                        onClick={() => setScreen({ name: 'app', app: app.id })}
                        data-testid={`os-app-${app.id}`}
                        aria-label={`Open ${app.name}`}
                        className="flex min-h-11 min-w-11 flex-col items-center gap-1 rounded-xl p-2 hover:bg-(--color-elev)"
                      >
                        <span
                          aria-hidden="true"
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-raise) text-lg text-(--color-aether)"
                        >
                          {app.name[0]}
                        </span>
                        <span className="spec-tech max-w-full truncate">{app.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {screen.name === 'app' && (
                <div data-testid="os-app-screen">
                  <button
                    type="button"
                    onClick={() => setScreen({ name: 'home' })}
                    data-testid="os-app-close"
                    aria-label="Back to home"
                    className="spec-tech min-h-11 rounded-full border border-(--color-border-hairline) px-4"
                  >
                    Home
                  </button>
                  <h3 className="spec-num mt-4 text-3xl">
                    {OS_APPS.find((a) => a.id === screen.app)?.name}
                  </h3>
                  <p className="mt-2 text-sm text-(--color-dim)">{APP_BODY[screen.app]}</p>
                </div>
              )}
              {screen.name === 'shade' && (
                <div data-testid="os-shade">
                  <h3 className="kicker">Notifications</h3>
                  {notifications.length === 0 && (
                    <p className="mt-3 text-sm text-(--color-dim)">All caught up.</p>
                  )}
                  <ul className="mt-3 space-y-2">
                    {notifications.map((note) => (
                      <li
                        key={note}
                        className="flex items-center justify-between gap-2 rounded-xl bg-(--color-elev) p-3"
                      >
                        <span className="text-sm">{note}</span>
                        <button
                          type="button"
                          onClick={() => dismiss(note)}
                          aria-label={`Dismiss ${note}`}
                          data-testid="os-dismiss"
                          className="spec-tech min-h-11 min-w-11 rounded-full border border-(--color-border-hairline) px-3"
                        >
                          Clear
                        </button>
                      </li>
                    ))}
                  </ul>
                  <h3 className="kicker mt-5">Quick settings</h3>
                  <div className="mt-2 grid grid-cols-2 gap-2" data-testid="os-quick">
                    {Object.entries(toggles).map(([k, v]) => (
                      <button
                        key={k}
                        type="button"
                        role="switch"
                        aria-checked={v}
                        aria-label={k}
                        onClick={() => flip(k)}
                        data-testid={`os-toggle-${k}`}
                        data-on={v}
                        className="min-h-11 rounded-xl border border-(--color-border-hairline) px-3 text-sm capitalize data-[on=true]:bg-(--color-aether-deep) data-[on=true]:text-(--color-ink)"
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <p className="kicker">AetherOS 2.0</p>
          <h2 className="spec-num mt-3 text-4xl md:text-5xl">Try the phone.</h2>
          <ul className="mt-4 space-y-2 text-(--color-dim)">
            {PHONE_INTERACTION_COPY.map((line) => (
              <li key={line} className="text-sm">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
