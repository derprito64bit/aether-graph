/** Aether One X body proportions in meters. Single source of truth for geometry. */
export const DIM = {
  w: 0.0768,
  h: 0.1596,
  t: 0.0078,
} as const

/** Glass panel inset from the frame edge (symmetric bezel, 1.45mm actual). */
export const BEZEL = 0.00145
/** Thin dark bezel between the glass edge and the lit display (1.6mm actual). */
export const DISPLAY_INSET = 0.0016

/** Rear ceramic panel stack. */
export const BACK_PANEL = { depth: 0.0028, z: -0.00251 } as const
export const BACK_FACE = -DIM.t / 2
/** Front glass plus the emissive display panel stacked inside it. */
export const FRONT_GLASS = { depth: 0.0015, z: 0.003 } as const
export const DISPLAY_PANEL = { depth: 0.0011, z: 0.00215 } as const

/** Front frame split: solid rear body plus a perimeter bezel ring. */
export const FRAME_BODY_DEPTH = 0.0042 // body zone; slab depth derives from planes
// The ring tiles against the body with no gap: body top sits at -0.0001
// (back face + depth - bevels), so the ring base starts exactly there. The
// old 0.0004 base left a 0.5mm perimeter groove that read edge-on as the
// device split in two phones.
export const RING_BASE_Z = -0.0001
export const RING_DEPTH = 0.004

/** Rear ceramic outboard face: the reference plane every rear feature seats against. */
export const CERAMIC_FACE_Z = -0.00391

/**
 * Circular camera module (Prompt A2, newest design authority). Centered on
 * the body axis in the upper third: two machined collar steps, domed cover
 * glass, three round lenses on a triangle plus a folded periscope, arc
 * flash, ToF pair, and a module mic. Replaces the Prompt-A square plateau.
 */
export const MODULE = {
  cx: 0, // centered horizontally, not offset
  cy: 0.0458, // 45.8mm up from body center
  outerR: 0.0235, // 47mm diameter, 61% of body width (enlarged per review)
  proud: 0.0019, // 1.9mm total rise off the rear panel
  baseFillet: 0.0007, // 0.7mm blend into the rear panel, a fillet not a chamfer
} as const
/** Concentric collar rings. Two machined steps, not one band. */
export const COLLAR = {
  outer: { rOut: 0.0235, rIn: 0.0206, rise: 0.0019, knurlTeeth: 192, knurlDepth: 0.00018 },
  step: { rOut: 0.0206, rIn: 0.0191, rise: 0.0012 },
  glass: { r: 0.0191, rise: 0.0008, dome: 0.00006 },
} as const
/** Dark seal ring where the cover glass meets the step. */
export const GLASS_SEAL = { rOut: 0.01915, rIn: 0.0188, depth: 0.00006 } as const
/** Three round assemblies on a triangle, apex up. Radius from module center. */
export const LENS_RING_R = 0.0102
/**
 * Round lens specs, polar placement. Per-lens barrel depths are physical:
 * ultra shallow (1.0mm), main (1.6mm), mid-tele deepest (2.1mm).
 * coatHue drives per-lens AR coating tint in radians.
 */
export const LENSES = [
  { key: 'main', angleDeg: 90, r: 0.006, barrelDepth: 0.0016, elementZ: -0.0009, coatHue: 2.1 },
  { key: 'ultra', angleDeg: 210, r: 0.0049, barrelDepth: 0.001, elementZ: -0.0005, coatHue: 4.6 },
  { key: 'mid', angleDeg: 330, r: 0.0049, barrelDepth: 0.0021, elementZ: -0.0013, coatHue: 0.3 },
] as const
/** Periscope window: a rounded rectangle, folded optic below the triangle. */
export const PERISCOPE = {
  x: 0,
  // Deviation from the first draft (y -0.0118, w 0.0128, h 0.0062): those
  // numbers collide with the ultra/mid collars and escape the cover glass.
  // Parked and sized to clear every collar and land inside the glass.
  y: -0.0151,
  w: 0.0122,
  h: 0.0055,
  r: 0.0022,
  recess: 0.0004,
  prismAngleDeg: 40, // interior face angle, so you cannot see straight down
  cavityDepth: 0.0026,
} as const
/** Flash as an arc segment cut into the step ring, not a satellite circle. */
export const FLASH_ARC = {
  startDeg: 24,
  sweepDeg: 34,
  rIn: 0.0195,
  rOut: 0.0204,
  dies: 2,
  diffuserRough: 0.62,
} as const
/** Module microphone, 0.7mm. Present because real modules have one. */
export const MODULE_MIC = { angleDeg: 152, ringR: 0.0168, d: 0.0007, depth: 0.0011 } as const
/** Time-of-flight scanner: separate emitter and receiver under one window. */
export const TOF = {
  ringR: 0.0142,
  angleDeg: 18,
  emitter: { d: 0.0021, offsetDeg: -4.2, depth: 0.0008 },
  receiver: { d: 0.0026, offsetDeg: 4.2, depth: 0.0011 },
  window: { w: 0.0082, h: 0.0034, r: 0.0017, recess: 0.00018 },
} as const
/** Medallion: polished metal inlay bonded under the cover glass. */
export const MEDALLION = {
  r: 0.0034,
  z: -0.00012, // 0.12mm below the glass outer face
  thickness: 0.00008,
  ringWidth: 0.00008,
} as const
/** Display bezel: fine matte ink layer printed on the glass underside. */
export const BEZEL_SURFACE = {
  color: '#07080b',
  roughness: 0.84,
  z: 0.0026,
  feather: 0.00012,
} as const
/** Optional two-material rear panel. Only some finishes get it. */
export const PANEL_SPLIT = {
  seamY: -0.0126, // 12.6mm below body center, lower third
  seamWidth: 0.00035,
  step: 0.00012, // lower panel sits 0.12mm proud of the upper
  seamChamfer: 0.00008,
} as const
/** Fictional optics partner for the medallion and collar text. */
export const OPTICS_PARTNER = 'NOVEK' as const
/** Module top plane: every lens builds outward from here. */
export const MODULE_FACE_Z = CERAMIC_FACE_Z - MODULE.proud

/** Bottom-edge hardware. */
export const GRILLE_SLOT = { w: 0.00055, h: 0.0003, depth: 0.0012 } as const
/**
 * USB-C receptacle. A true boolean hole is out of reach procedurally, so
 * the cavity reads through a chamfered mouth rim, a dark self-shadowing
 * interior set inside the edge line, and a centred tongue with contacts.
 */
export const PORT = {
  w: 0.0084,
  h: 0.0026,
  r: 0.0013,
  cavityDepth: 0.0042,
  tongue: { w: 0.0064, h: 0.0007, depth: 0.0032 },
} as const
/** Six speaker slots marching right of the port, instanced. */
export const SPEAKER_XS = [0.0082, 0.0106, 0.013, 0.0154, 0.0178, 0.0202] as const
/** Primary mic hole left of the port, different diameter from the grille. */
export const MIC_X = -0.0085
export const MIC_R = 0.00042

/** Half spans for edge details. */
export const SX = DIM.w / 2
export const SY = DIM.h / 2

/** Antenna interruption bands: 1.4mm wide, inset 0.05mm, finish-matched. */
export const ANTENNA_BAND = { w: 0.0014, inset: 0.00005, depth: 0.004 } as const
/** Buttons sit in machined pockets: 0.2mm recess, 0.1mm gap, 0.4mm proud. */
export const BUTTON_POCKET = { recess: 0.0002, gap: 0.0001, proud: 0.0004 } as const
/** Front sensors: 3.2mm punch-hole with 0.15mm dark ring, earpiece slot. */
export const PUNCH = { r: 0.0016, ring: 0.00015, y: 0.0728 } as const
export const EARPIECE = { w: 0.012, h: 0.0006, y: 0.0772 } as const

/**
 * Superellipse exponents. The exponent controls corner fullness: 2 is an
 * ellipse, 4 reads as a phone, 5.5 as a brick. Body 6.0: rectangular with
 * smoothed corners, the glass carried out to the rails. The camera module
 * is circular (Prompt A2), not a squircle.
 */
export const BODY_N = 6.0

/**
 * Chamfer sizes in meters. Every visible edge gets one or it renders as a
 * hard colour boundary with no specular line.
 */
export const CHAMFER = {
  glassMeet: 0.00035,
  moduleBase: 0.0005, // 0.50mm, module into the rear panel, a fillet not a flat
  collarStep: 0.0003, // 0.30mm, between collar tiers
  collar: 0.00015,
  button: 0.0001,
  portMouth: 0.0002,
  body: 0.0009, // 0.90mm, frame body edge: rectangular, smoothed corners
} as const

/** Vertical silhouette height in meters for a scale and x-rotation. */
export function silhouetteHeightM(scale: number, rxRad: number): number {
  return scale * (DIM.h * Math.cos(rxRad) + DIM.t * Math.sin(rxRad))
}

/** Horizontal silhouette width in meters for a scale and y-rotation. */
export function silhouetteWidthM(scale: number, ryRad: number): number {
  return scale * (Math.abs(DIM.w * Math.cos(ryRad)) + DIM.t * Math.abs(Math.sin(ryRad)))
}
