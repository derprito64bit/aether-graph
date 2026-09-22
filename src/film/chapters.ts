import { LEAD_OPTIONS, PENCIL, PENCIL_FINISHES, pencilPrice } from '../data/pencil.ts'
import type { ActId } from './key.ts'
import type { CalloutDef } from './overlay/callouts.ts'

export interface ChapterNumeral {
  value: string
  unit: string
}

export interface Chapter {
  act: ActId
  kicker: string
  headline: string
  body: string
  numeral?: ChapterNumeral
  spec?: string[]
}

/**
 * Editorial captions per act. Copy lives here as data, never inline in JSX.
 * Every figure is imported from src/data so the film and the specifications
 * table can never disagree.
 */
export const CHAPTERS: Chapter[] = [
  {
    act: 'arrival',
    kicker: `${PENCIL.fullName}`,
    headline: 'The instrument, not the accessory.',
    body: 'A precision drafting pencil, presented in one continuous shot.',
  },
  {
    act: 'settle',
    kicker: `${PENCIL.weightG} grams, tip-forward`,
    headline: 'Weighted like a promise.',
    body: 'Balance biased toward the point, so the pencil does the pressing.',
  },
  {
    act: 'approach',
    kicker: 'Knurled grip',
    headline: 'Cut to hold still.',
    body: `A ${PENCIL.sleeveLengthMm} mm sleeve pilots the line; the grip keeps the hand out of it.`,
  },
  {
    act: 'teardown',
    kicker: 'Inside',
    headline: 'Ten parts. One axis.',
    body: `The pencil opens along its length: sleeve, clutch, and spring, one layer at a time.`,
    numeral: { value: String(PENCIL.partCount), unit: 'parts' },
    spec: [`${PENCIL.leadDiamMm} mm lead`],
  },
  {
    act: 'camera',
    kicker: 'Three-jaw clutch',
    headline: 'Zero wobble.',
    body: `Three brass jaws close to ${PENCIL.clutchToleranceMm} mm. The lead cannot wander.`,
    numeral: { value: String(PENCIL.clutchJaws), unit: 'jaws' },
    spec: [`${PENCIL.clutchToleranceMm} mm tolerance`, `${PENCIL.advanceMm} mm per knock`],
  },
  {
    act: 'display',
    kicker: 'Anodised finish',
    headline: 'Dyed, not painted.',
    body: `${PENCIL_FINISHES.length} finishes over the same machined core. Colour that cannot chip.`,
    numeral: { value: String(PENCIL_FINISHES.length), unit: 'finishes' },
    spec: PENCIL_FINISHES.map((f) => f.name),
  },
  {
    act: 'storage',
    kicker: 'Lead',
    headline: 'Four grades. One diameter.',
    body: `${PENCIL.leadGrades} in ${PENCIL.leadDiamMm} mm. Hard for layout, soft for shade.`,
    numeral: { value: String(PENCIL.leadDiamMm), unit: 'mm lead' },
    spec: LEAD_OPTIONS.map((l) => `${l.label} · ${l.grades}`),
  },
  {
    act: 'battery',
    kicker: 'Balance',
    headline: `${PENCIL.weightG} grams, tip-forward.`,
    body: 'Heavy where the work happens, light where the hand rests.',
    numeral: { value: String(PENCIL.weightG), unit: 'grams' },
    spec: [`${PENCIL.lengthMm} mm overall`, `${PENCIL.barrelDiamMm} mm barrel`],
  },
  {
    act: 'software',
    kicker: 'Craft',
    headline: 'Drawn, not decorated.',
    body: 'Every edge chamfered, every seam a hairline. Nothing applied afterward.',
  },
  {
    act: 'ai',
    kicker: 'Precision',
    headline: 'The line goes where you put it.',
    body: `A ${PENCIL.sleeveLengthMm} mm fixed sleeve sights the point like a gunsight.`,
    numeral: { value: String(PENCIL.sleeveLengthMm), unit: 'mm sleeve' },
  },
  {
    act: 'final',
    kicker: `${PENCIL.fullName}`,
    headline: 'Choose your finish.',
    body: `Four finishes, two diameters, from $${pencilPrice('graphite', '05')}. Configure below.`,
  },
]

/**
 * Teardown layer copy. One kicker, one headline, one sentence, one figure
 * per layer. Every figure comes from src/data so the film and the
 * specifications table can never disagree.
 */
export interface TeardownCopy {
  key: string
  kicker: string
  headline: string
  body: string
  figure: string
}

export const TEARDOWN_COPY: TeardownCopy[] = [
  {
    key: 'lead',
    kicker: 'Lead',
    headline: 'The point of it all.',
    body: 'Graphite and clay, kilned hard. The only part that ever touches paper.',
    figure: `${PENCIL.leadDiamMm} mm · ${PENCIL.leadGrades}`,
  },
  {
    key: 'sleeve',
    kicker: 'Lead sleeve',
    headline: 'The gunsight.',
    body: 'A fixed steel tube that pilots the lead and sights the line.',
    figure: `${PENCIL.sleeveLengthMm} mm fixed`,
  },
  {
    key: 'nose',
    kicker: 'Nose cone',
    headline: 'Eighteen millimetres of sightline.',
    body: 'A long tapered cone so the hand never blocks the view of the point.',
    figure: '18 mm cone',
  },
  {
    key: 'clutch',
    kicker: 'Clutch',
    headline: 'Three jaws, one grip.',
    body: 'Brass jaws close on the lead with every knock and never let it slip back.',
    figure: `${PENCIL.clutchJaws} jaws · ${PENCIL.clutchToleranceMm} mm`,
  },
  {
    key: 'grip',
    kicker: 'Grip',
    headline: 'Cut to hold still.',
    body: 'Diamond knurling at a true machined pitch. Sweat and graphite stay out of the story.',
    figure: `${PENCIL.knurlPitchMm} mm knurl`,
  },
  {
    key: 'shaft',
    kicker: 'Reservoir',
    headline: 'A magazine, not a body.',
    body: 'The shaft stores spare leads and carries every knock to the clutch.',
    figure: 'Spare-lead store',
  },
  {
    key: 'spring',
    kicker: 'Spring',
    headline: 'The reset.',
    body: 'Twelve millimetres of compression steel. Every knock returns exactly.',
    figure: '12 mm compression',
  },
  {
    key: 'barrel',
    kicker: 'Barrel',
    headline: 'Eighty-two millimetres of intent.',
    body: 'One anodised tube, chamfered at both ends, balanced for the long line.',
    figure: `${PENCIL.lengthMm} mm overall`,
  },
  {
    key: 'clip',
    kicker: 'Clip',
    headline: 'Sprung, not bent.',
    body: 'Spring steel with a real hinge action. It holds a pocket without stretching.',
    figure: 'Spring steel',
  },
  {
    key: 'cap',
    kicker: 'Cap and knock',
    headline: 'The handshake.',
    body: `Cap, knock button, and eraser. ${PENCIL.advanceMm} mm of lead per press, every press.`,
    figure: `${PENCIL.advanceMm} mm per knock`,
  },
]

/**
 * Exploded-diagram callouts. Seven labels maximum: only parts a general
 * audience can care about. Copy lives here as data, never inline in JSX.
 */
export const CALLOUTS: CalloutDef[] = [
  {
    partId: 'clutch',
    title: 'Three-jaw clutch',
    body: `brass · ${PENCIL.clutchToleranceMm} mm tolerance · grips without slipping`,
    priority: 1,
  },
  {
    partId: 'lead',
    title: 'Lead',
    body: `${PENCIL.leadDiamMm} mm · ${PENCIL.leadGrades} · the only part that touches paper`,
    priority: 2,
  },
  {
    partId: 'spring',
    title: 'Return spring',
    body: '12 mm compression steel · every knock returns exactly',
    priority: 4,
  },
  {
    partId: 'grip',
    title: 'Knurled grip',
    body: `${PENCIL.knurlPitchMm} mm diamond cut · sweat stays out of the story`,
    priority: 5,
  },
  {
    partId: 'sleeve',
    title: 'Fixed sleeve',
    body: `${PENCIL.sleeveLengthMm} mm steel · sights the line`,
    priority: 6,
  },
  {
    partId: 'barrel',
    title: 'Barrel',
    body: `${PENCIL.lengthMm} mm · anodised, chamfered both ends`,
    priority: 7,
  },
  {
    partId: 'cap',
    title: 'Knock',
    body: `${PENCIL.advanceMm} mm of lead per press`,
    priority: 8,
  },
]
