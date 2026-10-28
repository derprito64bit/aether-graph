import { LEAD_OPTIONS, PENCIL, PENCIL_FINISHES, pencilPrice } from '../data/pencil.ts'
import type { ActId } from './key.ts'

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
    body: `A ${PENCIL.lengthMm} mm drafting pencil with a three-jaw brass clutch, built to hold a ${PENCIL.leadDiamMm} mm line.`,
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
    body: 'Laid out in assembly order: the shell along the top, the mechanism beneath it.',
    numeral: { value: String(PENCIL.partCount), unit: 'parts' },
    spec: [`${PENCIL.leadDiamMm} mm lead`, `${PENCIL.lengthMm} mm overall`],
  },
  {
    act: 'xray',
    kicker: 'X-ray',
    headline: 'The ghost and the machine.',
    body: 'Shell dissolved, mechanism solid. Everything the hand never sees, in place.',
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
    kicker: 'Serviceable',
    headline: 'Ten parts. No glue.',
    body: 'Every part unscrews or slides free, so the clutch can be cleaned and the spring replaced.',
  },
  {
    act: 'final',
    kicker: `${PENCIL.fullName}`,
    headline: 'Choose your finish.',
    body: `Four finishes, two lead sizes, from $${pencilPrice('graphite', '05')}.`,
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
  /** Material line for the exploded view's parts list. */
  material: string
}

export const TEARDOWN_COPY: TeardownCopy[] = [
  {
    key: 'lead',
    kicker: 'Lead',
    headline: 'The point of it all.',
    body: 'Graphite and clay, kilned hard. The only part that ever touches paper.',
    figure: `${PENCIL.leadDiamMm} mm · ${PENCIL.leadGrades}`,
    material: 'Graphite and clay',
  },
  {
    key: 'sleeve',
    kicker: 'Lead sleeve',
    headline: 'The gunsight.',
    body: 'A fixed steel tube that pilots the lead and sights the line.',
    figure: `${PENCIL.sleeveLengthMm} mm fixed`,
    material: 'Stainless steel',
  },
  {
    key: 'nose',
    kicker: 'Nose cone',
    headline: 'A clear sightline.',
    body: 'A long tapered cone so the hand never blocks the view of the point.',
    figure: `${PENCIL.noseConeMm} mm cone`,
    material: 'Anodised aluminium',
  },
  {
    key: 'clutch',
    kicker: 'Clutch',
    headline: 'Three jaws, one grip.',
    body: 'Brass jaws close on the lead with every knock and never let it slip back.',
    figure: `${PENCIL.clutchJaws} jaws · ${PENCIL.clutchToleranceMm} mm`,
    material: 'Brass',
  },
  {
    key: 'grip',
    kicker: 'Grip',
    headline: 'Cut to hold still.',
    body: 'Diamond knurling at a true machined pitch. It holds through sweat and graphite dust.',
    figure: `${PENCIL.knurlPitchMm} mm knurl`,
    material: 'Anodised aluminium',
  },
  {
    key: 'shaft',
    kicker: 'Reservoir',
    headline: 'A magazine, not a body.',
    body: 'The shaft stores spare leads and carries every knock to the clutch.',
    figure: 'Spare-lead store',
    material: 'Aluminium',
  },
  {
    key: 'spring',
    kicker: 'Spring',
    headline: 'The reset.',
    body: 'Compression steel that returns every knock to the same place.',
    figure: `${PENCIL.springMm} mm compression`,
    material: 'Spring steel',
  },
  {
    key: 'barrel',
    kicker: 'Barrel',
    headline: 'One tube, balanced.',
    body: 'One anodised tube, chamfered at both ends, balanced for the long line.',
    figure: `${PENCIL.lengthMm} mm overall`,
    material: 'Anodised aluminium',
  },
  {
    key: 'clip',
    kicker: 'Clip',
    headline: 'Sprung, not bent.',
    body: 'Spring steel with a real hinge action. It holds a pocket without stretching.',
    figure: 'Spring steel',
    material: 'Spring steel',
  },
  {
    key: 'cap',
    kicker: 'Cap and knock',
    headline: 'The handshake.',
    body: `Cap, knock button, and eraser. ${PENCIL.advanceMm} mm of lead per press, every press.`,
    figure: `${PENCIL.advanceMm} mm per knock`,
    material: 'Aluminium and rubber',
  },
]
