# ADR: Sketch to model

Date: 2026-10-28. Status: accepted.

The pencil first appears as an ink drawing, then a cobalt render front
sweeps tip to crown and turns it into the rendered model
(`src/components/PencilViewer/SketchReveal.tsx`).

How:

- Drawing layers, built once per mesh as children (so they inherit every
  transform): an inverted hull for silhouettes at constant screen width, an
  `EdgesGeometry` crease layer, and a paper fill cross-hatched by facing
  angle. A cobalt chain centreline runs along the axis.
- The real materials get an `onBeforeCompile` patch that discards fragments
  past the front and blends a cobalt ring at it. One shared
  `customProgramCacheKey`, patched before first compile, so the film never
  recompiles mid-scroll (invariant 4).
- The front is an axial position in the model root's local space, so it
  holds still on the pencil while camera and pose move.

Drivers:

- Film: `filmFront(p)`, a pure function of scroll progress over
  `0.006..0.085`. Reverse scrub retraces it (invariant 1).
- Viewers: a clock started when the viewer is at least 35% on screen; 450ms
  hold, 1.5s sweep. Reduced motion shows the finished model.

Cost: three extra draws per mesh while drawing. Once the front clears the
crown the layers are hidden and the front is parked at `1e6`, so nothing
can be discarded by a stale root matrix (the exploded parts travel far
along the axis). Per frame the component writes uniforms only.

Landmines:

- Sketch objects carry `userData.sketch` and a no-op `raycast`, so callout
  occlusion and part inspection keep hitting the real parts.
- New meshes added to `PencilModel` get drawing layers automatically; a mesh
  with heavy triangle counts adds proportionally to the `EdgesGeometry`
  build at mount.
