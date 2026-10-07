# Twin Towers Physics Check

An open workbook on the collapse of the World Trade Center towers: a physics model anyone can change, an interactive simulation built on it, and a sourced record of what was known beforehand.

## Ground rules

1. **Every number is sourced or flagged.** `data/inputs.json` tags each value `nist`, `estimate` or `standard`. Estimates are meant to be challenged.
2. **The picture never outruns the math.** The simulation may only show what `physics/` computes. Anything drawn for orientation (flames, smoke, dust) is labelled as drawn.
3. **Both sides get the same treatment.** Each claim is listed with what it predicts, what the record shows, and a status: documented, disputed, or not supported.
4. **Limits are stated.** This is a hand-calculation model. It is not a finite-element simulation.

## Layout

| Folder | What | Owner |
|---|---|---|
| `physics/` | Pure functions, no DOM. Validated against published figures in `physics/test`. | Claude |
| `data/` | Inputs, sources, flight timeline, warnings record (JSON). | Claude |
| `docs/` | Model notes, task split, open questions. | Claude |
| `app/` | The interactive 3D simulation and site. | Codex |
| `prototype/` | The first single-file version, kept as a working reference. | frozen |

## Run

```
npm test                 # validates the physics against NIST figures
open prototype/index.html
```

See `docs/HANDOFF.md` for who does what and `docs/MODEL_NOTES.md` for what the model can and cannot say.
