import { U, TOWER, sway, fireEnergy, gasTemp, cSteel, columnAt, progression } from './physics.js';
/* ---------- simulation model: one run precomputed from the calc-sheet formulas ---------- */
const SIMK = { sagC: 600, stagger: 5, dtS: 5, peakC: 1000, lateC: 500, trussAV: 300, fy: 65 };
const KE_ACTUAL = { wtc1: 0.5 * 283600 * U.LB * Math.pow(443 * U.MPH, 2), wtc2: 0.5 * 283600 * U.LB * Math.pow(542 * U.MPH, 2) };
function wallGas(tRel, psf) {            /* gas temperature at the wall, minutes after the fire arrives there */
  if (tRel < 0) return 20;
  const peakMin = 5 * psf, burn = 22.5 * psf;
  let g = gasTemp(tRel, { peakC: SIMK.peakC, peakMin, lateC: SIMK.lateC });
  if (tRel > burn) g = Math.max(60, g - (g - 60) * (tRel - burn) / 20);
  return g;
}
function simulate(I) {
  const F = I.impactFloor, floorsAbove = Math.max(1, 110 - (F + 2));
  const floors = [-3, -2, -1, 0, 1, 2, 3].filter(i => F + i <= 109 && F + i >= 2);
  const order = [0, 1, -1, 2, -2, 3, -3].filter(i => floors.includes(i)).slice(0, I.stripped);
  const sw = sway({ floorMass: I.floorMlb * 1e6 * U.LB, beta: 1.3, period: 11.4, momentumFrac: 1, planeLb: I.planeLb, speedMph: I.speedMph, impactFloor: F });
  const keRatio = sw.KE / KE_ACTUAL[I.tower];
  const plateIn = Math.min(1.5, Math.max(0.25, 0.25 + (floorsAbove - 12) * 0.0075));
  const cp = { plateIn, fyKsi: SIMK.fy };
  const demand = 0.5 * floorsAbove * I.floorMlb * 1e6 / 236 / 1000 * (1 + 0.10 * Math.min(3, keRatio));
  const tw = plateIn * U.IN, rho = 7850, sig = 5.67e-8, dIns = I.insIn * U.IN;
  const st = floors.map(i => ({ i, bare: order.includes(i), t0: I.reachMin + Math.abs(i) * SIMK.stagger, truss: 20, col: 20, sagAt: null }));
  const burnEnd = Math.max(...st.map(s => s.t0)) + 22.5 * I.loadPsf + 25;
  const tEnd = Math.min(240, Math.max(burnEnd, 30)), frames = [];
  let outcome = { type: 'stands', t: tEnd }, n = Math.round(tEnd * 60 / SIMK.dtS);
  for (let k = 0; k <= n; k++) {
    const t = k * SIMK.dtS / 60;
    for (const s of st) {
      const Tg = wallGas(t - s.t0, I.loadPsf);
      /* floor truss: all sides in the fire */
      if (s.bare || dIns <= 0) { const h = 25 * (Tg - s.truss) + 0.7 * sig * (Math.pow(Tg + 273, 4) - Math.pow(s.truss + 273, 4)); s.truss += h * SIMK.trussAV / (rho * cSteel(s.truss)) * SIMK.dtS; }
      else s.truss += (0.12 / dIns) * SIMK.trussAV * (Tg - s.truss) / (rho * cSteel(s.truss)) * SIMK.dtS;
      /* outer column: one face of four in the fire, three faces losing heat to outside air at 20 C */
      const gain = (s.bare || dIns <= 0) ? 25 * (Tg - s.col) + 0.7 * sig * (Math.pow(Tg + 273, 4) - Math.pow(s.col + 273, 4)) : (0.12 / dIns) * (Tg - s.col);
      const loss = 3 * (25 * (s.col - 20) + 0.7 * sig * (Math.pow(s.col + 273, 4) - Math.pow(293, 4)));
      s.col += (gain - loss) / (4 * tw * rho * cSteel(s.col)) * SIMK.dtS;
      if (s.sagAt == null && s.truss >= SIMK.sagC) s.sagAt = t;
    }
    /* longest run of neighbouring sagged floors */
    let best = [], run = [];
    for (const s of st) { if (s.sagAt != null) { run.push(s); if (run.length > best.length) best = run.slice(); } else run = []; }
    const unbraced = best.length + 1, pool = best.length ? best : st;
    const Tcol = Math.max(...pool.map(s => s.col)), cap = columnAt(cp, unbraced, Tcol).cap, ratio = demand / cap;
    if (k % 6 === 0 || ratio >= 1) frames.push({ t, unbraced, Tcol, cap, ratio, fl: st.map(s => ({ i: s.i, truss: s.truss, col: s.col, gas: wallGas(t - s.t0, I.loadPsf), sag: s.sagAt != null ? Math.min(1, (t - s.sagAt) / 4) : 0, bare: s.bare })), run: best.map(s => s.i) });
    if (ratio >= 1) { const pr = progression({ connCapLb: 29e6, floorLoadLb: 2.5e6, daf: 2, floorsAbove }); outcome = { type: pr.arrests ? 'partial' : 'collapse', t, pr }; break; }
  }
  return { frames, outcome, sw, demand, plateIn, floorsAbove, floors, keRatio, coldCap: columnAt(cp, 1, 20).cap,
    fe: fireEnergy({ fuelGal: I.fuelGal, fuelInsideFrac: 0.6, loadPsf: I.loadPsf, fireFloors: floors.length, burnFrac: 0.7, hcContents: 16, minutes: outcome.t }) };
}

export { SIMK, KE_ACTUAL, wallGas, simulate };
