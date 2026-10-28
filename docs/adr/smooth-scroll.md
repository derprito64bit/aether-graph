# ADR: Lenis for wheel smoothing, still one animation runtime

Date: 2026-10-28. Status: accepted.

Lenis (pinned 1.3.26) smooths wheel input for the whole page. It is a
scroll smoother, not an animation runtime: it drives the real window
scroll position, so Motion's `useScroll`, the film's progress MotionValue,
and every scroll-linked transform keep working unchanged. Motion stays the
single animation runtime (`docs/adr/motion.md`).

Why: on a notched mouse wheel the HTML overlay stepped per notch while the
3D camera glided on its damping, so copy and product moved at different
rhythms. Eased wheel input makes them one motion. Touch keeps native
momentum (Lenis leaves touch alone by default).

Rules:

- One instance, owned by `src/scroll/smooth.ts`, started by `ScrollManager`.
- Every programmatic scroll goes through `scrollToY` / `scrollToElement`.
  Jumps (`?t=` deep links, route resets) use native `window.scrollTo`,
  because Lenis caches the page height and would clamp a jump made right
  after the film runway mounts. Smooth moves call `resize()` first.
- No `scroll-behavior: smooth` on `html` (Lenis owns easing).
- Reduced motion: no instance, every jump instant.
