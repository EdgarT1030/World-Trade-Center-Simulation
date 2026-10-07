# Task split

Two AI tools work in this repo. The split is by folder so they never edit the same file.

## Claude: investigation and calculations
Owns `physics/`, `data/`, `docs/`.
- Extend and correct the physics. Every change comes with a test in `physics/test` that ties it to a published figure.
- Research primary sources and keep `data/*.json` accurate. No claim without a source id.
- Review Codex's pull requests for one thing: does the screen show anything the physics did not compute?

## Codex: the interactive simulation
Owns `app/`.
- Build the game-style 3D simulation and the site around it.
- Read numbers from `data/*.json` and results from `physics/src/index.js`. Never hard-code a physical number or change a formula.
- If the simulation needs something the physics does not provide, write the request in `docs/REQUESTS.md` and use a clearly marked placeholder until Claude delivers it.

## The contract between them
`physics/src/index.js` exports:

- `simulate(inputs)` returns `{ frames, outcome, sw, demand, floorsAbove, floors, ... }`
  - `inputs`: `{ tower, impactFloor, speedMph, planeLb, fuelGal, stripped, insIn, floorMlb, loadPsf, reachMin }`
  - `frames[]`: one per half minute: `{ t, unbraced, Tcol, cap, ratio, run[], fl[] }`, where each `fl` is `{ i, truss, col, gas, sag, bare }` for one fire floor
  - `outcome`: `{ type: 'collapse' | 'partial' | 'stands', t, pr }`
- `sway`, `windDrift`, `fireEnergy`, `heatSteel`, `column`, `progression` for the individual checks

Changing these shapes needs a note in `docs/REQUESTS.md` first.

## First tasks

Claude
1. Replace the tuned "fire reaches the wall" input with a fire-spread model, or state clearly why it cannot be done by hand.
2. Add the core columns to the collapse check (the leaseholder's engineers argued the core failed first).
3. Source the tower's weight per storey and the column plate sizes at the impact floors, which are currently estimates.
4. Add Building 7 as its own model.
5. Evidence library: add document links (Commission staff memos, Joint Inquiry, declassified FBI files) to `data/warnings.json`.

Codex
1. Scaffold `app/` (Vite + TypeScript + Three.js).
2. Build the tower from `data/inputs.json`: 110 floors, 59 columns per face, the core, mechanical floors.
3. Fly-the-plane controls and replay camera, driven by `simulate()` frames.
4. Heat-coloured steel, sagging floors and wall bowing from frame data.
5. Panels for the calc sheet and warnings record, rendered from `data/`.
