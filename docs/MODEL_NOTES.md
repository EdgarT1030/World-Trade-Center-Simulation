# Model notes

## What agrees with published figures (see `physics/test`)
- Roof sway of WTC 2 after impact: model 19.6 in, NIST video measurement 22 +/- 5 in.
- Wind needed for NIST's 51 to 65 in design drift: 136 to 153 mph at roof height.
- Average fire heat output: about 1.1 GW, NIST estimate on the order of 1 GW.
- NIST's floor-connection check: 11.6 floors static, 5.8 dynamic.

## Estimates that drive results
- Weight of one storey (5.5 million lb).
- Outer column plate thickness at the impact floors (0.25 in WTC 1, 0.375 in WTC 2) and yield strength (65 ksi).
- Insulation conductivity (0.12 W/m.K).
- Number of neighbouring floors stripped of insulation at the failing wall.
- Minutes until fire burns hard at the failing wall. **This is tuned so the two real cases land near 102 and 56 minutes. The model does not predict collapse time.**
- Flight 175 weight assumed equal to Flight 11.

## Known weaknesses
- Plane speed, weight and fuel barely change the outcome. Impact damage is not modelled beyond a scaling of load shifted onto the wall.
- Only the outer wall is checked for buckling. The core is not modelled.
- Recovered steel does not confirm the temperatures: NIST found 3 of 170+ outer-panel locations above 250 C, and says its samples (3% of fire-floor outer columns) are not representative (NCSTAR 1-3).
- NIST did not test for explosive residue and did not model the collapse after initiation. Both are listed as open on the site.
- Building 7 is not covered.
