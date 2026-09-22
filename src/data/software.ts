export type AppId =
  'camera' | 'photos' | 'messages' | 'weather' | 'music' | 'maps' | 'timer' | 'settings'

export interface OsApp {
  id: AppId
  name: string
  tagline: string
}

/** The eight mini apps in the AetherOS simulator. */
export const OS_APPS: OsApp[] = [
  { id: 'camera', name: 'Camera', tagline: 'Five focal lengths, one thumb.' },
  { id: 'photos', name: 'Photos', tagline: 'Cleanup happens on-device.' },
  { id: 'messages', name: 'Messages', tagline: 'Summarized locally.' },
  { id: 'weather', name: 'Weather', tagline: 'Glanceable, quiet.' },
  { id: 'music', name: 'Music', tagline: 'Lossless over Wi-Fi 7.' },
  { id: 'maps', name: 'Maps', tagline: 'Offline regions included.' },
  { id: 'timer', name: 'Timer', tagline: 'Haptics, not noise.' },
  { id: 'settings', name: 'Settings', tagline: 'Every toggle explained.' },
]

/** Software principles shown on the software page. */
export const SOFTWARE_PRINCIPLES = [
  {
    title: 'On-device first',
    body: 'Summaries, transcripts, and photo cleanup never leave the phone.',
  },
  {
    title: 'Quiet by default',
    body: 'Notifications group by context and step aside when focus is on.',
  },
  {
    title: 'One-handed',
    body: 'Apps open in a single motion. Quick settings fall within reach.',
  },
]

/** Short demonstrative bullets for the AetherOS phone simulator. */
export const PHONE_INTERACTION_COPY = [
  'Everything stays on-device: summaries, transcripts, and photo cleanup never leave the phone.',
  'Pull the status bar down for a one-handed quick-settings panel.',
  'Apps open in a single motion: one thumb, no menus to memorize.',
  'Notifications group by context and quietly step aside when focus is on.',
]
