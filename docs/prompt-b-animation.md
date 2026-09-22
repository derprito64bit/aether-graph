# PROMPT B: Animation, exploded views, and transitions

Run against `C:\Users\Aaron\aether-one-x-v2` in opencode, after Prompt A. Motion only: the exploded view system, component closeups, and transition craft. No new geometry or materials except where a motion beat requires a missing part.

---

## 0. ROLE

Technical director for a real-time product film. Timing, weight, staging, handoff. The measure of success: a viewer scrubbing backward never sees a pop, snap, or teleport. Everything reverses as smoothly as it plays.

---

## 1. WHAT IS ALREADY THERE

`key.ts` (`FilmKey`, `smoothstep`), `timeline.ts` (`KEYS`, `ACTS`, `actAt`), `sample.ts` (zero-alloc re-clocked sampler), `states.ts` (`computeFilmStates`, thirteen scalars — extend, do not replace), `shots.ts` (`SHOTS`), `lighting.ts` (`STAGE_LIGHTING`), `FilmDirector.tsx` (single `useFrame`, no React renders), `Internals.tsx` (four groups: board, silicon, power, optics), `zoom.ts` (four helpers), `Scrubber.tsx` + `?t=`.

Rules: scroll values never enter React state; zero allocation in `useFrame`; everything a pure function of progress; reduced motion snaps; `npm run verify` green at the end.

---

## 2. THE CORE PROBLEM WITH THE CURRENT EXPLODE

Four groups along z with fixed spreads is not an exploded view: parts travel as slabs, fan-out is axial only, and there is no per-part stagger (the wave claimed in `docs/motion.md` is not implemented).

---

## 3. THE EXPLODED VIEW SYSTEM

`src/film/internals/explode.ts`: `ExplodePart` registry (id, origin, distance, delay, tumble, layer), direction derived from centroid offset blended with z (`radialMix` ~0.45), delays normalised into [0, 0.45] from centroid distance, `partProgress` mapping master explode through delay windows. Precompute directions at module load; one scratch `Vector3` per frame. Register 20-30 parts across chassis, board, silicon, power, optics (stub meshes for Prompt A parts if missing).

---

## 4. THE CONTROL PLANE, EXTENDED

Add `explodeRadial`, `explodeOptics`, `calloutOpacity`, `sectionCut`, `focusPull`, `macroAtmos` to `FilmStates` via `ramplike` windows in the shared scratch object. Tests: every scalar in [0,1] over 1,000 samples; all back to 0 by p=1 except `screenOn`.

---

## 5. THE FOUR COMPONENT CLOSEUPS

Chip (0.33-0.47): verify the dolly zoom is visible; add a hold at 0.432-0.440 (near-static camera, macro damp); time BGA reveal before the flat-on angle. Camera (0.52-0.72): staged five-part lens separation sequence; rack focus via `focusPull` (measure DoF cost with chrome-devtools MCP first, blurred-plane fallback); hold at 0.685-0.700. Battery (0.89-0.93): two-stage cell-wrap peel then lift; coil lifts last; check `cellGlow` against exposure for clipping. Port beat: extend `approach` with a rail traverse (cheap, no boundary shift) or insert a beat with an ADR; boundary shifts require updating `ACTS`, all `ramplike` windows, and re-capturing snapshots in one commit.

---

## 6. CALLOUTS FOR THE EXPLODED VIEW

NDC-projected HTML labels with one SVG leader-line layer, aggressive culling (occlusion, off-screen, threshold, collision), entry staggered to `partProgress`, copy in `chapters.ts` (spec-consistent, enforced by `chapters.test.ts`), full opacity with no travel under reduced motion.

---

## 7. TRANSITIONS

Audit all twelve act boundaries at 0.002 steps; fix seams by overlapping (not butting) `ramplike` windows. Extend `ShotProfile` with `targetDampPerSecond`, `maxAngularVelocity`, `maxFovVelocity`, `settle`; cap in the director (fixes flick whip). Configurator finishes lerp over 400ms on ease-out-expo. Audit `SHELL_MATS`/`FRAME_MATS` against Prompt A's new keys. Verify the match cut midpoint shows neither layer readable. Idle value-noise confirmed; parallax clamped ~0.5deg. No GSAP in the film (Motion only; the installed GSAP MCP is not a reason).

---

## 8. REDUCED MOTION

Explode to final state instantly, callouts full opacity, no sway/parallax/tumble; static story keeps separations (information, not decoration). Verify via the existing axe run covering both motion modes.

---

## 9. PERFORMANCE

55fps sustained, no frame over 50ms, under 4x throttle. Use `scripts/measure-fps.mjs` and chrome-devtools MCP on the x-ray, camera-dive, and battery windows. Cull before projecting; never `getBoundingClientRect` per frame; DoF only under ~3ms.

---

## 10. VERIFICATION

`npm run verify`; reverse scrub 1.0 to 0.0; twelve-boundary audit; flick test both directions; explode read at 0.5; hold test at each closeup; frame timing with numbers; snapshot regression with eye review; reduced-motion pass.

---

## 11. ORDER OF WORK

States extension, `explode.ts` + tests, part split + loop, radialMix tuning, shot caps + director, boundary audit, closeup holds, callouts, port beat + ADR, rack focus if measured, idle/parallax/reduced-motion pass, verification + docs + snapshots.
