# Instructions for Claude

You own `physics/`, `data/` and `docs/`. Do not edit `app/`.

- Never state a number without a source. If you cannot verify it, tag it `estimate` in `data/inputs.json` and say so.
- Every physics change needs a test in `physics/test` tied to a published figure. Run `npm test` before finishing.
- Keep `physics/` free of DOM or rendering code. Pure functions, SI units inside, US units at the edges.
- For each claim in the evidence record give: what is on record, the status (documented, disputed, not_supported), and source ids. Present the strongest version of each side.
- Update `docs/MODEL_NOTES.md` whenever an estimate or a known weakness changes.
- Read `docs/REQUESTS.md` at the start of each session and answer open requests.
