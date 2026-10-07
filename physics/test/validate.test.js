// Checks the model against published figures. If a change breaks one of these, the model is wrong or the test needs a sourced reason to change.
import test from 'node:test';
import assert from 'node:assert/strict';
import { U, sway, windForDrift, fireEnergy, heatSteel, column, progression, simulate } from '../src/index.js';

const base = { floorMass: 5.5e6 * U.LB, beta: 1.3, period: 11.4, momentumFrac: 1 };
const near = (x, lo, hi, msg) => assert.ok(x >= lo && x <= hi, `${msg}: got ${x}, expected ${lo}..${hi}`);

test('WTC 2 roof sway matches NIST video measurement (22 +/- 5 in)', () => {
  const s = sway({ ...base, planeLb: 283600, speedMph: 542, impactFloor: 81 });
  near(s.roof / U.IN, 17, 27, 'roof sway in');
  near(s.f70 / U.IN, 9, 14, 'floor 70 sway in (NIST 12 +/- 1)');
});
test('model stiffness reproduces NIST design-wind drift at a plausible wind speed', () => {
  near(windForDrift({ ...base, planeLb: 1, speedMph: 1, impactFloor: 96 }, 51.2 * U.IN), 110, 170, 'mph for 51 in drift');
});
test('fire heat output is on the order of 1 GW (NISTIR 6879)', () => {
  const f = fireEnergy({ fuelGal: 10000, fuelInsideFrac: 0.6, loadPsf: 4, fireFloors: 7, burnFrac: 0.7, hcContents: 16, minutes: 102 });
  near(f.hrrGW, 0.5, 2, 'GW'); near(f.jetShare, 0.05, 0.25, 'jet fuel share');
});
test('bare truss passes 600 C, insulated truss does not', () => {
  const h = heatSteel({ peakC: 1000, peakMin: 20, lateC: 500, totalMin: 102, AV: 300, insIn: 2.5, lambda: 0.12 });
  assert.ok(h.peakBare > 900); assert.ok(h.peakIns < 600);
});
test('outer column is lightly loaded as designed', () => {
  const c = column({ floorMass: base.floorMass, perimShare: 0.5, redistrib: 0.1, pullKip: 5, fyKsi: 65, plateIn: 0.25, floorsAbove: 12, unbraced: 1, colC: 20 });
  near(c.ratio, 0.1, 0.35, 'load/capacity');
});
test('NIST FAQ floor-connection check: 11.6 static, 5.8 dynamic', () => {
  const p = progression({ connCapLb: 29e6, floorLoadLb: 2.5e6, daf: 2, floorsAbove: 12 });
  near(p.nStatic, 11.5, 11.7, 'static'); near(p.nDyn, 5.7, 5.9, 'dynamic'); assert.equal(p.arrests, false);
});
test('simulation: documented cases collapse, insulation-on case stands', () => {
  const w1 = { tower: 'wtc1', impactFloor: 96, speedMph: 443, planeLb: 283600, fuelGal: 10000, stripped: 5, insIn: 2.5, floorMlb: 5.5, loadPsf: 4, reachMin: 88 };
  assert.equal(simulate(w1).outcome.type, 'collapse');
  assert.equal(simulate({ ...w1, stripped: 0 }).outcome.type, 'stands');
  assert.equal(simulate({ ...w1, impactFloor: 105 }).outcome.type, 'stands');
});
