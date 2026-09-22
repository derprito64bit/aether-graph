# ADR: separate film material set

Date: 2026-09-19. Status: accepted.

Every material is created per instance (`createPhoneMaterials`), and the
film owns its own set, isolated from the product viewers.

Why: the x-ray act dissolves the shell by driving opacity per material.
Sharing one set would dissolve the configurator phone at the same time,
and per-viewer finish lerps would fight the director's per-frame writes.
Isolation costs one extra material set in GPU memory (~4MB textures are
shared canvases, not duplicated uploads of consequence) and buys
deterministic ownership: the director writes, nobody else does.

Consequence: any material key added in the viewer set must also exist in
the film set path (same factory, so this is automatic) and must be added
to `SHELL_MATS`/`FRAME_MATS`, or new parts stay solid through x-ray.
`subpixel` and `rangeGlass` were caught exactly this way.
