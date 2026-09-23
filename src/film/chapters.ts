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
    act: 'hero',
    kicker: `${PENCIL.fullName}`,
    headline: 'The instrument, not the accessory.',
    body: 'A precision drafting pencil, presented in one continuous shot.',
  },
  {
    act: 'detail',
    kicker: 'Knurled grip',
    headline: 'Cut to hold still.',
    body: `A ${PENCIL.sleeveLengthMm} mm sleeve pilots the line; the grip keeps the hand out of it.`,
    numeral: { value: String(PENCIL.knurlPitchMm), unit: 'mm knurl' },
    spec: [`${PENCIL.weightG} g tip-forward`],
  },
  {
    act: 'exploded',
    kicker: 'Inside',
    headline: 'Ten parts. One axis.',
    body: `The pencil opens along its length: sleeve, clutch, and spring, one layer at a time.`,
    numeral: { value: String(PENCIL.partCount), unit: 'parts' },
    spec: [`${PENCIL.leadDiamMm} mm lead`, `${PENCIL.lengthMm} mm overall`],
  },
  {
    act: 'xray',
    kicker: 'X-ray',
    headline: 'The ghost and the machine.',
    body: 'Shell dissolved, mechanism solid. Everything the hand never sees, held open.',
    numeral: { value: String(PENCIL.clutchJaws), unit: 'brass jaws' },
  },
  {
    act: 'mechanism',
    kicker: 'Three-jaw clutch',
    headline: 'Zero wobble.',
    body: `Three brass jaws close to ${PENCIL.clutchToleranceMm} mm. The lead cannot wander.`,
    numeral: { value: String(PENCIL.advanceMm), unit: 'mm per knock' },
    spec: [`${PENCIL.clutchToleranceMm} mm tolerance`, `${PENCIL.leadGrades} lead`],
  },
  {
    act: 'reassembly',
    kicker: 'Reassembly',
    headline: 'Home, to the micron.',
    body: 'Every part returns to its seat. No bounce, no overshoot — engineered.',
  },
  {
    act: 'final',
    kicker: `${PENCIL.fullName}`,
    headline: 'Choose your finish.',
    body: `Four finishes, two diameters, from $${pencilPrice('graphite', '05')}. Configure below.`,
    numeral: { value: String(PENCIL_FINISHES.length), unit: 'finishes' },
    spec: [
      ...PENCIL_FINISHES.map((f) => f.name),
      ...LEAD_OPTIONS.map((l) => `${l.label} · ${l.grades}`),
    ],
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
 * Exploded-diagram callouts. One label per part: during the feature run
 * only the featured part's bubble shows; outside the run the establishing
 * and restack labels bracket the diagram. Copy lives here as data, never
 * inline in JSX.
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
    partId: 'shaft',
    title: 'Reservoir shaft',
    body: 'spare-lead store · carries every knock to the clutch',
    priority: 3,
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
    partId: 'nose',
    title: 'Nose cone',
    body: '18 mm tapered cone · the hand never blocks the point',
    priority: 6,
  },
  {
    partId: 'sleeve',
    title: 'Fixed sleeve',
    body: `${PENCIL.sleeveLengthMm} mm steel · sights the line`,
    priority: 7,
  },
  {
    partId: 'barrel',
    title: 'Barrel',
    body: `${PENCIL.lengthMm} mm · anodised, chamfered both ends`,
    priority: 8,
  },
  {
    partId: 'clip',
    title: 'Pocket clip',
    body: 'spring steel · holds without stretching',
    priority: 9,
  },
  {
    partId: 'cap',
    title: 'Knock',
    body: `${PENCIL.advanceMm} mm of lead per press`,
    priority: 10,
  },
]
