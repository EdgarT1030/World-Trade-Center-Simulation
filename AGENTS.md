# Instructions for Codex

You own `app/`. Do not edit `physics/`, `data/` or `docs/` except to append to `docs/REQUESTS.md`.

## What to build
A browser-based, game-style 3D simulation of the Twin Towers impacts and fires that anyone can change and replay. Stack: Vite, TypeScript, Three.js. No backend.

## Hard rules
- All physical results come from `physics/src/index.js`. Call `simulate(inputs)` and render its frames. Do not write or change formulas.
- All physical constants and inputs come from `data/inputs.json`. Do not hard-code them.
- Anything on screen that is not computed (flames, smoke, dust, debris paths, sound) must be listed in an always-reachable "What is drawn, not computed" panel.
- Every slider shows its tag (NIST, Estimate, Standard) and source from `data/`.
- The tower must be able to survive. Never script a collapse; play whatever `outcome` says.
- No people, no gore, no sensational effects. This depicts a real mass-casualty event. Keep it a technical reconstruction.
- If you need data or a calculation that does not exist, append a request to `docs/REQUESTS.md` and use a visibly labelled placeholder.

## Reference
`prototype/index.html` is a working 2D version of everything. Match its behaviour before adding to it.

## Done means
`npm test` passes, the app builds, and the two documented cases and the "insulation stays on" case give the same outcomes as the prototype.
