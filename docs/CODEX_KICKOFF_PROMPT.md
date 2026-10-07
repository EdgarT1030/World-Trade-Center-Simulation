Read AGENTS.md, README.md and docs/HANDOFF.md first, then open prototype/index.html to see the working 2D version.

Build the first version of the 3D simulation in app/ (Vite + TypeScript + Three.js):

1. Build the tower from data/inputs.json at true scale: 110 storeys, 207 ft square, 59 box columns per face, the 135 x 87 ft core with 47 columns, floor slabs, mechanical floors, and the mast on WTC 1.
2. Let me choose the tower, then aim the plane: drag to set the impact floor, sliders for speed, weight and fuel. Add an orbit camera and a cutaway view of the fire floors.
3. On Run, call simulate(inputs) from physics/src/index.js once and play its frames: impact and sway, fire spreading, steel coloured by temperature, floors sagging, the outer wall bowing, then whatever outcome it returns (collapse, partial, or stands). Add pause, scrub and replay speed.
4. Show live gauges from the frame data: clock, hottest truss, wall column temperature, floors sagging in a row, wall load versus buckling strength.
5. Add the "What is drawn, not computed" panel and source tags on every input.

Do not change anything in physics/ or data/. If you need something that is missing, append it to docs/REQUESTS.md and use a labelled placeholder.

When finished, confirm that Flight 11 into WTC 1 and Flight 175 into WTC 2 collapse at about the same minute as the prototype, and that "insulation stays on" leaves the tower standing.
