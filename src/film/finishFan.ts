import type { PencilFinishId } from '../data/pencil.ts'

/**
 * The finish fan in the film's final act: the graphite hero fans out into
 * the other three finishes like a hand of cards. Pure functions of the fan
 * envelope (states.ts finishFan), so a reverse scrub folds it back exactly.
 */

/** Fanned behind the hero, in this order. */
export const VARIANT_FINISHES: readonly PencilFinishId[] = ['steel', 'brass', 'ember']

/** Pivot on the pencil axis, hero-local metres (the grip, below centre). */
export const FAN_PIVOT_Y = -0.036
/** Lean added per card, radians (clockwise on screen: crowns open to the right). */
export const FAN_STEP = -0.19
/** Depth per card behind the hero, metres: more than a barrel, so none intersect. */
export const FAN_DEPTH = 0.0105

function smooth01(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

/** One card's pose for a fan amount: written into `out`, zero allocation. */
export interface CardPose {
  lean: number
  depth: number
  opacity: number
}

/**
 * Card `k` (0 nearest the hero) leaves a little after the one in front of
 * it, so the fan opens as a sequence. It slides out from directly behind
 * the hero, fading in over its first part of travel.
 */
export function cardPose(fan: number, k: number, out: CardPose): CardPose {
  const local = smooth01((fan - k * 0.14) / 0.72)
  out.lean = FAN_STEP * (k + 1) * local
  out.depth = -FAN_DEPTH * (k + 1) * Math.min(1, local * 3)
  out.opacity = smooth01(local / 0.35)
  return out
}
