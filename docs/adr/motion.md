# ADR: Motion, not GSAP

Date: 2026-09-19. Status: accepted.

The project runs Motion as its single runtime (handoff D1). The GSAP MCP
is installed and unused.

Why: the film is a pure function of scroll progress with no timeline
playback — there is nothing for a timeline engine to own. UI motion is
entrance crossfades and micro-interactions, which Motion covers at a
fraction of the weight. One runtime, one easing vocabulary, no
cross-engine handoff bugs.

Consequence: any animation that needs scrubbing, reversing, or act
coupling goes through progress math and MotionValues, never through an
imperative tween.
