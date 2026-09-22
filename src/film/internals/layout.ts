import { MODULE } from '../../components/PhoneViewer/phoneDimensions.ts'

/**
 * Internal component manifest (Prompt C section 2). Single source of truth
 * for every internal position, in meters, origin at body centre: +y up, +z
 * toward the front face. Back face at -0.0039, front face at +0.0039.
 *
 * The z stack, back to front: back panel inner face (-0.0028), coil and NFC,
 * graphite, boards with components facing rearward (the x-ray dive comes
 * from behind, and shield cans face the removable cover, as in real
 * assemblies), battery, display stack. No coordinates live in JSX: parts
 * files map over these entries.
 */

/** Main logic board, upper third. Component side faces the rear cover. */
export const MAIN_BOARD = {
  w: 0.066,
  h: 0.046,
  thickness: 0.0008,
  cx: 0,
  cy: 0.042,
  cz: -0.0012,
} as const

/** Daughterboard, bottom edge. Carries the port, SIM, and charge path. */
export const SUB_BOARD = {
  w: 0.062,
  h: 0.02,
  thickness: 0.0008,
  cx: 0,
  cy: -0.0625,
  cz: -0.0012,
} as const

/** Board-to-board flex, routed up the left edge. */
export const BTB_FLEX = {
  x: -0.0302,
  yTop: 0.0215,
  yBottom: -0.053,
  width: 0.0064,
  thickness: 0.00018,
} as const

export interface BoardPartDef {
  id: string
  x: number
  y: number
  w: number
  h: number
  z: number
  label: string | null
}

/** Main-board components on the rear face (cz = -0.0016 plane). */
export const BOARD_PARTS: BoardPartDef[] = [
  // SoC plus RAM package-on-package stack. The hero of the chip act.
  { id: 'soc', x: -0.013, y: 0.0345, w: 0.016, h: 0.016, z: 0.0011, label: 'A1 Ultra' },
  { id: 'nand', x: 0.01, y: 0.0345, w: 0.011, h: 0.009, z: 0.0008, label: 'Storage' },
  { id: 'modem', x: 0.021, y: 0.048, w: 0.009, h: 0.009, z: 0.0007, label: 'Modem' },
  { id: 'pmic', x: -0.024, y: 0.048, w: 0.008, h: 0.007, z: 0.0006, label: 'Power' },
  { id: 'codec', x: -0.006, y: 0.0585, w: 0.005, h: 0.005, z: 0.0005, label: 'Audio' },
  { id: 'rf-a', x: 0.026, y: 0.0585, w: 0.005, h: 0.004, z: 0.0005, label: 'RF' },
  { id: 'rf-b', x: -0.028, y: 0.0585, w: 0.005, h: 0.004, z: 0.0005, label: 'RF' },
  { id: 'rf-c', x: 0.028, y: 0.03, w: 0.005, h: 0.004, z: 0.0005, label: 'RF' },
  { id: 'btb-up', x: 0, y: 0.0215, w: 0.008, h: 0.002, z: 0.0009, label: null },
]

/** Sub-board components on the rear face. */
export const SUB_PARTS: BoardPartDef[] = [
  { id: 'charge-ic', x: -0.015, y: -0.062, w: 0.006, h: 0.005, z: 0.0006, label: 'Charge' },
  { id: 'sim-cage', x: 0.016, y: -0.0625, w: 0.012, h: 0.006, z: 0.0011, label: 'SIM' },
  { id: 'btb-low', x: 0, y: -0.053, w: 0.008, h: 0.002, z: 0.0009, label: null },
]

export interface ShieldCanDef {
  id: string
  x: number
  y: number
  w: number
  h: number
  rise: number
}

/** Shield cans over the component groups. Lids lift separately. */
export const SHIELD_CANS: ShieldCanDef[] = [
  { id: 'can-soc', x: -0.013, y: 0.0345, w: 0.019, h: 0.019, rise: 0.0014 },
  { id: 'can-mem', x: 0.0105, y: 0.0345, w: 0.014, h: 0.012, rise: 0.0011 },
  { id: 'can-rf', x: 0.021, y: 0.049, w: 0.013, h: 0.013, rise: 0.001 },
  { id: 'can-power', x: -0.023, y: 0.05, w: 0.013, h: 0.012, rise: 0.0009 },
]

/** Battery cell. Largest single component. Volume checked against product data. */
export const BATTERY_CELL = {
  w: 0.058,
  h: 0.078,
  thickness: 0.0042,
  cx: 0,
  // Top edge parks 1mm clear of the main board bottom (0.019): plan
  // overlaps with the board read as clipping in the explode.
  cy: -0.021,
  cz: -0.0005,
  tabX: 0.019,
  tabY: 0.018, // tabs ride the top edge, never float above it
} as const

/** Wireless charging coil, flat litz, sitting over the cell. */
export const COIL = {
  rOut: 0.021,
  rIn: 0.011,
  turns: 18,
  wireW: 0.00052,
  thickness: 0.0004,
  cx: 0,
  cy: -0.008,
  // Behind the cell rear face (-0.0026): buried inside the cell z-range
  // before, which bricked the windings over the cell face.
  cz: -0.0028,
} as const

/** NFC antenna ring, outboard of the coil. */
export const NFC = {
  rOut: 0.026,
  rIn: 0.023,
  thickness: 0.00012,
  cx: 0,
  cy: -0.008,
  cz: -0.0032,
} as const

/** Vapor chamber over the SoC, extending down across the battery top. */
export const VAPOR_CHAMBER = {
  w: 0.048,
  h: 0.062,
  thickness: 0.0006,
  cx: 0,
  cy: 0.02,
  // Clear of the board rear face (-0.0016): coplanar touch read as a seam.
  cz: -0.002,
} as const

/** Graphite spreader, larger and thinner, outboard of the chamber. */
export const GRAPHITE = {
  w: 0.062,
  h: 0.09,
  thickness: 0.00012,
  cx: 0,
  cy: 0.01,
  cz: -0.0021,
} as const

export interface MechPartDef {
  id: string
  x: number
  y: number
  w: number
  h: number
  d: number
}

/** Electromechanical parts: haptics, speakers, port block. */
export const MECH: MechPartDef[] = [
  // X-axis linear resonant actuator. Rectangular, heavy-looking, flex tail.
  { id: 'haptic', x: -0.019, y: -0.043, w: 0.024, h: 0.009, d: 0.003 },
  { id: 'speaker', x: 0.02, y: -0.064, w: 0.018, h: 0.011, d: 0.004 },
  { id: 'earpiece', x: 0, y: 0.072, w: 0.012, h: 0.004, d: 0.0025 },
  { id: 'port-block', x: 0, y: -0.0735, w: 0.0084, h: 0.0026, d: 0.0042 },
]

/** Coaxial RF cables routed along both edges. */
export const COAX = [
  { id: 'coax-l', x: -0.033, yTop: 0.056, yBottom: -0.056, d: 0.00085 },
  { id: 'coax-r', x: 0.033, yTop: 0.052, yBottom: -0.06, d: 0.00085 },
] as const

/** Midframe fasteners. Eight, Torx, perimeter. */
export const SCREWS = [
  { x: -0.03, y: 0.07 },
  { x: 0.03, y: 0.07 },
  { x: -0.033, y: 0.02 },
  { x: 0.033, y: 0.02 },
  { x: -0.033, y: -0.03 },
  { x: 0.033, y: -0.03 },
  { x: -0.029, y: -0.072 },
  { x: 0.029, y: -0.072 },
] as const
export const SCREW = { headD: 0.0016, headDepth: 0.0004, driveD: 0.0009 } as const

/**
 * Internal camera housing: the A2 module mounts to the main board and
 * protrudes rearward through the cover. Overlap in plan view is correct.
 */
export const CAMERA_INTERNAL = {
  cx: MODULE.cx,
  cy: MODULE.cy,
  cz: -0.0022,
  r: MODULE.outerR,
} as const

/** Back panel inner face: the rearmost internal plane. */
export const BACK_INNER_Z = -0.0028
