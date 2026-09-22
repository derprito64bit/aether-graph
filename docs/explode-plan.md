# Exploded-view plan — flat lay-out, per-layer dive and flip, capability callouts

Goal (user spec): the device explodes while flat with every part laid out;
scrolling dives into each layer, flips it toward the viewer in detail, with
text and leader lines detailing each part's capability.

## What already exists (do not rebuild)

- `src/film/internals/explode.ts`: part registry with removal order
  (`REMOVAL_ORDER`), per-layer `radialMix` (sheets 0.15, screws 0.85,
  battery 0.10), weight tumble, screw spin as `explode × 2π` (reverse-safe),
  wide lay-out distances (5–11mm). Delays: order dominates, radial breaks
  ties. All pure functions of the explode scalar.
- `src/film/internals/layout.ts`: full manifest, bounds-tested.
- `src/film/internals/Internals.tsx`: per-part loop, shield-lid reveal
  window (`shieldLift`), coil ring (`coilRing`), die rearward lift.
- `src/film/overlay/Callouts.tsx` + `callouts.ts`: HTML labels, single SVG
  leader layer, occlusion culling, collision hiding, staggered entry,
  reduced-motion static. Copy in `chapters.ts` (9 capability labels max).
- `src/film/states.ts`: `explodeXray`, `explodeRadial`, `shieldLift`,
  `calloutOpacity` windows; everything returns to 0 except `screenOn`.

## What to build

1. **Flat staging pass.** Keep the phone near-flat through the x-ray act
   (pose rx ≈ 0, rear toward camera). Verify at 0.3 / 0.5 / 0.7: each still
   must read as a legible diagram, outer layers further out than inner.
2. **Per-layer dive keys.** Inside the existing `explodeXray` window
   (0.27–0.50, do not move it), add 3–4 camera keys that push toward each
   layer in removal order: panels/coil → shields/lids → board/components →
   battery/optics. Small dolly moves (2–4cm), aim tracking the layer
   centroid. Rigid, reversible, no new scalars.
3. **Flip-to-viewer envelopes.** Tumble already turns parts as they lift;
   extend so each layer's flip peaks inside its dive key: scale the
   layer's tumble by a `ramplike` envelope centered on its key. Flat sheets
   stay under 0.05 rad (weightless look is the failure mode); lids 0.25
   about the long axis; camera module 0.30; battery none.
4. **Capability callouts.** Copy already written (9 max). Verify each of
   the 9 anchors at full explode: no more than 9 on screen, collision
   culling hides the rest, leaders attach to settled parts (entry rides
   `partProgress`). Label positions must survive the dive keys (re-check
   after step 2).
5. **Weight legibility.** Battery slow + still; screws fast + full spin;
   lids medium + tilt. Scrub 0.27→0.50 and infer mass from motion alone.
6. **Reverse scrub.** 1.0→0.0 slowly: every part retraces; screws unspin
   exactly (pure function — assert in `explode.test.ts` if touched).

## Verification

- Stills at explode 0.3 / 0.5 / 0.7 committed and eye-reviewed as diagrams.
- Reverse scrub with zero pops (primary test).
- Frame time through 0.25–0.52 under 4× CPU throttle (chrome-devtools
  trace); callout projection loop culls before projecting.
- Reduced-motion: explode snaps per act, callouts full opacity, no tumble.
- Re-capture all thirteen film snapshots; review diffs.

## Non-goals

- New registry, new scalars, new act boundaries, GSAP (forbidden by
  Prompt B §12), SSR postprocessing (measure first per Prompt C §5.6).
