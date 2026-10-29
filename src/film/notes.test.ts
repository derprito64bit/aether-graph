import { describe, expect, it } from 'vitest'
import { isLetterable } from '../components/Lettering/strokeFont.ts'
import { FILM_NOTES, noteWritten } from './notes.ts'
import { ACTS } from './timeline.ts'

describe('film margin notes', () => {
  it('can all be lettered and sit inside the frame', () => {
    for (const note of FILM_NOTES) {
      expect(isLetterable(note.text), note.text).toBe(true)
      expect(note.x).toBeGreaterThan(0.05)
      expect(note.x).toBeLessThan(0.9)
      expect(note.y).toBeGreaterThan(0.08)
      expect(note.y).toBeLessThan(0.92)
      expect(note.to).toBeGreaterThan(note.from)
      expect(note.to).toBeLessThan(0.9)
    }
  })

  it('write only inside their own act, and are erased by its end', () => {
    for (const note of FILM_NOTES) {
      const act = ACTS.find((a) => a.id === note.act)
      expect(act).toBeDefined()
      if (act === undefined) continue
      const span = act.end - act.start
      expect(noteWritten(note, act.start - 0.001)).toBe(0)
      expect(noteWritten(note, act.end)).toBe(0)
      expect(noteWritten(note, act.start + span * (note.to + 0.01))).toBe(1)
      expect(noteWritten(note, act.start + span * (note.from + note.to) * 0.5)).toBeGreaterThan(0)
      expect(noteWritten(note, act.start + span * (note.from + note.to) * 0.5)).toBeLessThan(1)
    }
  })

  it('never jumps: small steps in progress make small steps in ink', () => {
    for (const note of FILM_NOTES) {
      let last = noteWritten(note, 0)
      for (let p = 0; p <= 1; p += 0.0005) {
        const v = noteWritten(note, p)
        expect(Math.abs(v - last)).toBeLessThan(0.2)
        last = v
      }
    }
  })
})
