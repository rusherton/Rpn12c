import test from 'node:test'; import assert from 'node:assert/strict';
import { solveTVM, tvmResidual, r10, formatNumber, dayNumber, fromDayNumber, days360, npv, irr } from '../src/engine.js';
import { near } from './helpers.js';
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
test('r10 rounds to 10 significant digits, clamps overflow/underflow', () => {
  assert.equal(r10(1 / 3), 0.3333333333); assert.equal(r10(2 / 3), 0.6666666667);
  assert.equal(r10(1e120), 9.999999999e99); assert.equal(r10(1e-120), 0); assert.equal(r10(-0), 0);
});
test('formatNumber edge cases', () => {
  assert.equal(formatNumber(1234567.891), '1,234,567.89'); assert.equal(formatNumber(0.001), '1.000000-03');
  assert.equal(formatNumber(9.999), '10.00'); assert.equal(formatNumber(12345678901), '1.234568 10');
  assert.equal(formatNumber(9999999999.4, 2), '9,999,999,999.'); assert.equal(formatNumber(-0.5, 0), '-1.');
  assert.equal(formatNumber(0, 4), '0.0000');
});
test('TVM random round trips (END/BEGIN, odd periods simple & compound)', () => {
  for (let k = 0; k < 500; k++) {
    const f = { n: Math.round(1 + rnd() * 400) + (rnd() < 0.3 ? Math.round(rnd() * 99) / 100 : 0), i: 0.05 + rnd() * 2,
      pv: 1000 + rnd() * 5e5, pmt: 0, fv: -rnd() * 1e5, begin: rnd() < 0.5, compound: rnd() < 0.5 };
    f.pmt = solveTVM('pmt', f);
    assert.ok(Math.abs(tvmResidual(f, f.i / 100)) / f.pv < 1e-8);
    near(solveTVM('pv', { ...f, pv: 0 }), f.pv, 1e-8); assert.ok(Math.abs(solveTVM('fv', { ...f, fv: 0 }) - f.fv) < 1e-8 * f.pv * Math.pow(1 + f.i / 100, f.n));
    const i = solveTVM('i', { ...f, i: 0 }); assert.ok(Math.abs(tvmResidual(f, i / 100)) / f.pv < 1e-8);
  }
});
test('zero-interest TVM', () => {
  assert.equal(solveTVM('pmt', { n: 12, i: 0, pv: 1200, fv: 0 }), -100);
  assert.equal(solveTVM('n', { n: 0, i: 0, pv: 1200, pmt: -100, fv: 0 }), 12);
});
test('calendar: day-number round trip over full range, 30/360 rules', () => {
  for (let z = dayNumber(1582, 10, 15); z < dayNumber(4046, 11, 25); z += 997) { const d = fromDayNumber(z - 719468); assert.equal(dayNumber(d.y, d.m, d.d), z); }
  assert.equal(days360({ y: 2004, m: 1, d: 31 }, { y: 2004, m: 3, d: 31 }), 60);
  assert.equal(days360({ y: 2004, m: 1, d: 15 }, { y: 2004, m: 3, d: 31 }), 76);
});
test('NPV/IRR consistency on random flows', () => {
  for (let k = 0; k < 100; k++) {
    const cfs = [{ v: -1000 - rnd() * 1e5, n: 1 }]; for (let j = 0; j < 8; j++) cfs.push({ v: rnd() * 3e4, n: 1 + Math.floor(rnd() * 3) });
    try { const r = irr(cfs); assert.ok(Math.abs(npv(r, cfs)) < 1e-4 * Math.abs(cfs[0].v)); } catch (e) { assert.equal(e.code, 7); }
  }
});
