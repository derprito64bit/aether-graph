import { smoothstep } from './key.ts'

export interface FilmStates {
  /** 0..1 how far the outer shell has dissolved. */
  shellGhost: number
  /** 0..1 how far the shell layers split apart. */
  shellSplit: number
  /** 0..1 how visible the internal hardware is. */
  internalOpacity: number
  /** 0..1 how far the internals explode apart (x-ray pass). */
  explodeXray: number
  /** 0..1 how far only the battery separates (energy climax). */
  explodeBatt: number
  /** 0..1 whether the A1 Ultra is the focused subject. */
  chipFocus: number
  /** 0..1 how far the die lifts out of the board plane. */
  chipLift: number
  /** 0..1 how far the cell pulls toward camera at the climax. */
  battLift: number
  /** 0..1 how far surroundings step back behind the subject. */
  subjectDim: number
  /** 0..1 whether the camera dives on the physical lens barrels. */
  cameraFocus: number
  /** 0..1 how far shell optics spread from the rear surface. */
  optical: number
  /** 0..1 partial interior glow during the energy story. */
  energy: number
  /** 0..1 live screen brightness. */
  screenOn: number
  /** 0..1 radial fan amount, separate from the axial explode. */
  explodeRadial: number
  /** 0..1 how far the camera module separates for its own beat. */
  explodeOptics: number
  /** 0..1 label and callout opacity for the exploded diagram. */
  calloutOpacity: number
  /** 0..1 cross-section clip, reserved for a future cutaway beat. */
  sectionCut: number
  /** 0..1 focus-pull amount toward the current subject. */
  focusPull: number
  /** 0..1 macro atmosphere presence in the closeup beats. */
  macroAtmos: number
  /** 0..1 shield lids lifted, so board components are revealed. */
  shieldLift: number
  /** 0..1 coil LED ring brightness for the Clear finish. */
  coilRing: number
  /** 0..1 phone rotates from upright to flat (teardown). */
  layDown: number
  /** 0..1 layers separate into the stack (teardown). */
  stackSeparate: number
  /** 0..10 continuous layer cursor across the feature run (teardown). */
  layerCursor: number
  /** 0..1 how strongly unfeatured layers recede (teardown). */
  contextRecede: number
}

/**
 * Plateau window: eases up from in1 to in2, holds until out1, eases to 0
 * by out2. The descent restores the shell and reseats the explosion.
 */
export function ramplike(p: number, in1: number, in2: number, out1: number, out2: number): number {
  const up = smoothstep((p - in1) / Math.max(1e-5, in2 - in1))
  const down = smoothstep((p - out1) / Math.max(1e-5, out2 - out1))
  return Math.min(up, 1 - down)
}

/**
 * Beat window for one teardown layer. Full 1 across the layer's own cursor
 * window [index, index + 1], ramping up over `lead` layers before and down
 * over `tail` after. Derived from the continuous layerCursor so beats track
 * the feature run instead of raw progress.
 */
export function layerWindow(cursor: number, index: number, lead: number, tail: number): number {
  const up = smoothstep((cursor - (index - lead)) / Math.max(1e-5, lead))
  const down = smoothstep((cursor - (index + 1)) / Math.max(1e-5, tail))
  return Math.min(up, 1 - down)
}

const STATES: FilmStates = {
  shellGhost: 0,
  shellSplit: 0,
  internalOpacity: 0,
  explodeXray: 0,
  explodeBatt: 0,
  chipFocus: 0,
  chipLift: 0,
  battLift: 0,
  subjectDim: 0,
  cameraFocus: 0,
  optical: 0,
  energy: 0,
  screenOn: 0,
  explodeRadial: 0,
  explodeOptics: 0,
  calloutOpacity: 0,
  sectionCut: 0,
  focusPull: 0,
  macroAtmos: 0,
  shieldLift: 0,
  coilRing: 0,
  layDown: 0,
  stackSeparate: 0,
  layerCursor: 0,
  contextRecede: 0,
}

/**
 * Deterministic per-progress scalars for the seven-act pencil film.
 * Reuses one scratch object: zero allocation per frame.
 *
 * Feature run: ten layer windows of 0.016 across 0.30 to 0.46, so the
 * continuous cursor is (p - 0.30) / 0.016. Snap float dust to integers.
 */
export function computeFilmStates(p: number): FilmStates {
  STATES.cameraFocus = ramplike(p, 0.63, 0.655, 0.695, 0.72)
  // Teardown cursor first: the shaft beats below derive from it so they
  // track layer 5 (p in [0.38, 0.396]) instead of raw progress.
  const rawCursor = (p - 0.3) / 0.016
  const snapped =
    Math.abs(rawCursor - Math.round(rawCursor)) < 1e-9 ? Math.round(rawCursor) : rawCursor
  const cursor = Math.min(10, Math.max(0, snapped))
  STATES.chipLift = layerWindow(cursor, 5, 0.5, 0.5)
  STATES.battLift = 0
  STATES.optical = ramplike(p, 0.63, 0.655, 0.695, 0.72)
  STATES.explodeXray = ramplike(p, 0.48, 0.51, 0.565, 0.595)
  STATES.explodeBatt = 0
  // X-ray hold across its own act: the outer shell dissolves while the
  // mechanism stays solid throughout. Separation itself stays fully
  // opaque: ghosting the entry read as a glitch, not a transition.
  STATES.shellGhost = Math.min(1, ramplike(p, 0.48, 0.51, 0.565, 0.595))
  STATES.shellSplit = ramplike(p, 0.28, 0.32, 0.72, 0.76)
  STATES.internalOpacity = Math.min(1, ramplike(p, 0.48, 0.51, 0.565, 0.595))
  STATES.chipFocus = layerWindow(cursor, 5, 0.5, 0.5)
  STATES.subjectDim = Math.max(
    ramplike(p, 0.36, 0.385, 0.42, 0.445),
    ramplike(p, 0.64, 0.655, 0.7, 0.715),
  )
  STATES.energy = 0
  STATES.screenOn = 0
  // Prompt B control plane. Windows overlap their neighbours rather than
  // butting them, so no second-derivative seam at handoffs.
  STATES.explodeRadial = ramplike(p, 0.26, 0.29, 0.72, 0.76)
  STATES.explodeOptics = ramplike(p, 0.63, 0.655, 0.695, 0.72)
  STATES.calloutOpacity = ramplike(p, 0.255, 0.285, 0.45, 0.475)
  STATES.sectionCut = 0
  STATES.focusPull = Math.max(
    ramplike(p, 0.17, 0.19, 0.21, 0.23),
    ramplike(p, 0.655, 0.67, 0.69, 0.705),
  )
  STATES.macroAtmos = Math.max(
    ramplike(p, 0.18, 0.2, 0.215, 0.23),
    ramplike(p, 0.66, 0.675, 0.69, 0.705),
  )
  STATES.shieldLift = 0
  STATES.coilRing = 0
  // Lay down for the exploded run through the mechanism beat, stand back
  // up across reassembly. Separate, hold through x-ray and mechanism,
  // restack into reassembly. layerCursor is a single continuous float:
  // integer part is the current layer, fraction is local progress.
  // Everything per-layer derives from it and reverses exactly.
  STATES.layDown = ramplike(p, 0.24, 0.26, 0.755, 0.79)
  STATES.stackSeparate = ramplike(p, 0.26, 0.29, 0.735, 0.765)
  STATES.layerCursor = cursor
  STATES.contextRecede = ramplike(p, 0.3, 0.315, 0.46, 0.475)
  return STATES
}
