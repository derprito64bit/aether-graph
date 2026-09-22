# ADR: HTML OS overlay instead of a projected screen

Date: 2026-09-19. Status: accepted.

The AetherOS simulator (app grid, notifications, quick settings, mini
apps) is DOM, not a canvas texture. The in-device display shows a live
procedural wallpaper texture; the OS lives beside the film as HTML.

Why: text in a canvas texture aliases, can't be selected, can't take
focus, and fails every screen-reader and keyboard test the project gates
on. DOM gives us focus management, aria roles, and the existing design
tokens for free, while the 3D display keeps doing what it is good at:
emissive light under glass.

Consequence: two screen truths (texture mode + HTML sim) driven by the
same `screenMode` control plane, so they can never disagree about
whether the screen is on.
