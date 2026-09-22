/**
 * Aether Graph 0.5 — fictional precision drafting pencil.
 *
 * Single source of truth for the film, the configurator, and the
 * specifications table. The film overlay and teardown copy must import
 * every figure from here so copy can never disagree with data.
 * All values are illustrative demonstration values for a fictional product.
 */

export type PencilFinishId = 'graphite' | 'steel' | 'brass' | 'ember'

export interface PencilFinish {
  id: PencilFinishId
  name: string
  tagline: string
  description: string
  /** CSS gradient used as the swatch chip in the UI. */
  swatch: string
  /** UI accent (underline, active ring) for this finish. */
  accent: string
  /** Base price delta against the graphite finish. */
  priceDelta: number
}

export const PENCIL_FINISHES: PencilFinish[] = [
  {
    id: 'graphite',
    name: 'Graphite',
    tagline: 'Blackened. Quietly dominant.',
    description: 'Black anodised barrel over a steel core. The closest thing to invisible.',
    swatch: 'linear-gradient(145deg,#4a4d55 0%,#101114 55%,#2a2c33 100%)',
    accent: '#c9a06a',
    priceDelta: 0,
  },
  {
    id: 'steel',
    name: 'Steel',
    tagline: 'Raw brushed metal, cool and precise.',
    description: 'Bead-blasted stainless with a hand-brushed grain. Each one arrives with its own.',
    swatch: 'linear-gradient(145deg,#ffffff 0%,#9ba0ab 45%,#3f424b 100%)',
    accent: '#9fb4c8',
    priceDelta: 8,
  },
  {
    id: 'brass',
    name: 'Brass',
    tagline: 'Warm metal that ages with you.',
    description: 'Solid brass, lacquered bright. It picks up a patina everywhere your hand rests.',
    swatch: 'linear-gradient(145deg,#f0cd8a 0%,#8a6a34 55%,#3d2d14 100%)',
    accent: '#e0b96f',
    priceDelta: 32,
  },
  {
    id: 'ember',
    name: 'Ember',
    tagline: 'Warm bronze, anodised deep.',
    description: 'A deep warm bronze over anodised aluminium. Catches low light like banked coals.',
    swatch: 'linear-gradient(145deg,#e8a06a 0%,#4a2e1a 55%,#241209 100%)',
    accent: '#e08a5f',
    priceDelta: 12,
  },
]

export const DEFAULT_PENCIL_FINISH: PencilFinishId = 'graphite'

export interface LeadOption {
  id: string
  label: string
  /** Lead diameter in millimetres. */
  diameterMm: number
  grades: string
  priceDelta: number
}

export const LEAD_OPTIONS: LeadOption[] = [
  { id: '05', label: '0.5 mm', diameterMm: 0.5, grades: 'HB · B · 2B · H', priceDelta: 0 },
  { id: '07', label: '0.7 mm', diameterMm: 0.7, grades: 'HB · B · 2B', priceDelta: 8 },
]

export const DEFAULT_LEAD_ID = '05'

export const PENCIL_BASE_PRICE = 86

export function pencilPrice(finishId: PencilFinishId, leadId: string): number {
  const finish = PENCIL_FINISHES.find((f) => f.id === finishId) ?? PENCIL_FINISHES[0]
  const lead = LEAD_OPTIONS.find((l) => l.id === leadId) ?? LEAD_OPTIONS[0]
  return PENCIL_BASE_PRICE + (finish?.priceDelta ?? 0) + (lead?.priceDelta ?? 0)
}

/** Engineering figures. Every film numeral and spec line draws from here. */
export const PENCIL = {
  name: 'Aether Graph',
  size: '0.5',
  fullName: 'Aether Graph 0.5',
  lengthMm: 142,
  barrelDiamMm: 9,
  weightG: 22,
  leadDiamMm: 0.5,
  leadGrades: 'HB · B · 2B · H',
  sleeveLengthMm: 4,
  knurlPitchMm: 0.4,
  clutchJaws: 3,
  clutchToleranceMm: 0.05,
  partCount: 10,
  advanceMm: 0.6,
} as const
