/* ---------- physics (pure functions; SI inside, US units at the edges) ---------- */
const U = { LB: 0.45359237, MPH: 0.44704, FT: 0.3048, IN: 0.0254, KIP: 4448.2216, G: 9.81,
  KG_PER_GAL: 66000 * 0.45359237 / 10000 /* NIST: 10,000 gal = 66,000 lb */ };
const TOWER = { stories: 110, H: 417, B: 63.1, storyIn: 144 };
const lerpTable = (tbl, x) => {
  if (x <= tbl[0][0]) return tbl[0][1];
  for (let i = 1; i < tbl.length; i++) if (x <= tbl[i][0]) {
    const [x0, y0] = tbl[i - 1], [x1, y1] = tbl[i];
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  }
  return tbl[tbl.length - 1][1];
};
/* Eurocode 3 (EN 1993-1-2) reduction factors for carbon steel */
const KY = [[20,1],[400,1],[500,.78],[600,.47],[700,.23],[800,.11],[900,.06],[1000,.04],[1100,.02],[1200,0]];
const KE = [[20,1],[100,1],[200,.9],[300,.8],[400,.7],[500,.6],[600,.31],[700,.13],[800,.09],[900,.0675],[1000,.045],[1100,.0225],[1200,0]];
const ky = T => lerpTable(KY, T), kE = T => lerpTable(KE, T);
/* Eurocode 3 specific heat of steel, J/kg.K */
function cSteel(T) {
  if (T < 600) return 425 + 0.773 * T - 1.69e-3 * T * T + 2.22e-6 * T * T * T;
  if (T < 735) return Math.min(5000, 666 + 13002 / (738 - T));
  if (T < 900) return Math.min(5000, 545 + 17820 / (T - 731));
  return 650;
}
/* Check 2 + 3: tower as a one-mode oscillator, mode shape (z/H)^beta */
function sway(p) {
  const M = TOWER.stories * p.floorMass, Mstar = M / (2 * p.beta + 1);
  const mp = p.planeLb * U.LB, v = p.speedMph * U.MPH;
  const phiI = Math.pow(p.impactFloor / TOWER.stories, p.beta);
  const J = p.momentumFrac * mp * v, w = 2 * Math.PI / p.period;
  const roof = J * phiI / Mstar / w;
  return { M, Mstar, K: w * w * Mstar, J, KE: 0.5 * mp * v * v, roof,
    f70: roof * Math.pow(70 / TOWER.stories, p.beta) };
}
const WIND = { rho: 1.2, Cd: 1.4, alpha: 0.2 };
function windDrift(p, mph) {
  const s = sway(p), V = mph * U.MPH;
  const Fstar = 0.5 * WIND.rho * WIND.Cd * TOWER.B * TOWER.H * V * V / (2 * WIND.alpha + p.beta + 1);
  return { drift: Fstar / s.K, q: 0.5 * WIND.rho * V * V };
}
function windForDrift(p, driftM) {
  const s = sway(p);
  return Math.sqrt(driftM * s.K * (2 * WIND.alpha + p.beta + 1) / (0.5 * WIND.rho * WIND.Cd * TOWER.B * TOWER.H)) / U.MPH;
}
/* Check 4: energy ledger */
function fireEnergy(p) {
  const jetKg = p.fuelGal * U.KG_PER_GAL;
  const jetAll = jetKg * 43e6, jetInside = jetAll * p.fuelInsideFrac;
  const areaM2 = 40000 * U.FT * U.FT, loadKgM2 = p.loadPsf * U.LB / (U.FT * U.FT);
  const contentsKgPerFloor = areaM2 * loadKgM2;
  const contents = p.fireFloors * contentsKgPerFloor * p.burnFrac * p.hcContents * 1e6;
  const total = jetInside + contents;
  return { jetKg, jetAll, jetInside, contents, contentsKgPerFloor, total,
    jetShare: jetInside / total, hrrGW: total / (p.minutes * 60) / 1e9 };
}
/* Check 5: lumped-mass steel heating, Eurocode 3 method */
function gasTemp(tMin, p) {
  const ramp = 3, fall = 10;
  if (tMin < ramp) return 20 + (p.peakC - 20) * tMin / ramp;
  if (tMin < ramp + p.peakMin) return p.peakC;
  if (tMin < ramp + p.peakMin + fall) return p.peakC + (p.lateC - p.peakC) * (tMin - ramp - p.peakMin) / fall;
  return p.lateC;
}
function heatSteel(p) {
  const dt = 5, n = Math.round(p.totalMin * 60 / dt), rho = 7850, out = [];
  let Tb = 20, Ti = 20; const dIns = p.insIn * U.IN;
  for (let i = 0; i <= n; i++) {
    const tMin = i * dt / 60, Tg = gasTemp(tMin, p);
    if (i % 12 === 0) out.push({ t: tMin, gas: Tg, bare: Tb, ins: Ti });
    const hnet = 25 * (Tg - Tb) + 0.7 * 5.67e-8 * (Math.pow(Tg + 273, 4) - Math.pow(Tb + 273, 4));
    Tb += hnet * p.AV / (rho * cSteel(Tb)) * dt;
    if (dIns > 0) Ti += (p.lambda / dIns) * p.AV * (Tg - Ti) / (rho * cSteel(Ti)) * dt; else Ti = Tb;
  }
  const peak = k => out.reduce((m, r) => Math.max(m, r[k]), 0);
  const first = (k, lim) => { const r = out.find(r => r[k] >= lim); return r ? r.t : null; };
  return { series: out, peakBare: peak('bare'), peakIns: peak('ins'), t600Bare: first('bare', 600), t600Ins: first('ins', 600) };
}
/* Check 6: perimeter box column, AISC 360 column curve with hot properties */
function columnAt(p, floors, T) {
  const b = 14, t = p.plateIn, bi = b - 2 * t;
  const A = b * b - bi * bi, I = (Math.pow(b, 4) - Math.pow(bi, 4)) / 12, r = Math.sqrt(I / A);
  const L = floors * TOWER.storyIn, E = 29000 * kE(T), Fy = p.fyKsi * ky(T);
  const Fe = Math.PI * Math.PI * E / Math.pow(L / r, 2);
  const Fcr = (Fy <= 0 || Fe <= 0) ? 0 : (Fy / Fe <= 2.25 ? Math.pow(0.658, Fy / Fe) * Fy : 0.877 * Fe);
  return { A, I, r, L, E, Fy, Fe, cap: Fcr * A, Pe: Fe * A };
}
function column(p) {
  const c = columnAt(p, p.unbraced, p.colC);
  const demand = p.perimShare * p.floorsAbove * p.floorMass * U.G / 236 / U.KIP * (1 + p.redistrib);
  const q = p.pullKip / TOWER.storyIn;
  const bow0 = c.E > 0 ? 5 * q * Math.pow(c.L, 4) / (384 * c.E * c.I) : Infinity;
  const bow = demand < c.Pe ? bow0 / (1 - demand / c.Pe) : Infinity;
  return { ...c, demand, ratio: demand / c.cap, bow0, bow, cold: columnAt(p, 1, 20).cap };
}
/* Check 7: NIST FAQ 18 floor-connection check + momentum-only crush-down time */
function progression(p) {
  const nStatic = p.connCapLb / p.floorLoadLb, nDyn = nStatic / p.daf;
  const h = TOWER.H / TOWER.stories, start = TOWER.stories - p.floorsAbove;
  let M = p.floorsAbove, v = 0, t = 0;
  for (let f = start; f > 0; f--) {
    const v2 = Math.sqrt(v * v + 2 * U.G * h); t += (v2 - v) / U.G;
    v = v2 * M / (M + 1); M += 1;
  }
  return { nStatic, nDyn, arrests: p.floorsAbove <= nDyn, crushT: t,
    freeT: Math.sqrt(2 * start * h / U.G), needFactor: p.floorsAbove * p.daf / nStatic };
}

export { U, TOWER, WIND, ky, kE, cSteel, sway, windDrift, windForDrift, fireEnergy, gasTemp, heatSteel, columnAt, column, progression };
