/** Pure helpers for the film. This module imports neither React nor three. */

/** Clamped 0..1 progress value. Construct through {@link toProgress}. */
export type Progress = number & { readonly __brand: 'Progress 0..1' }

/** Clamp a raw number into a {@link Progress} value in units of fraction 0..1. */
export function toProgress(value: number): Progress {
  const clamped = Math.min(1, Math.max(0, value))
  return clamped as Progress
}
