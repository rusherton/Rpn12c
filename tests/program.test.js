import test from 'node:test'; import assert from 'node:assert/strict';
import { calc } from './helpers.js';

test('handbook program: discount + handling charge, keycodes', () => {
  const c = calc().keys('f R/S'); c.shows('00-'); c.keys('f RDN'); c.shows('00-');
  const shown = [];
  for (const k of ['ENTER', '2', '5', '%', '-', '5', '+']) { c.keys(k); shown.push(c.display()); }
  assert.deepEqual(shown, ['01-  36', '02-  2', '03-  5', '04-  25', '05-  30', '06-  5', '07-  40']);
  c.keys('SST'); c.shows('08-  43,33 00');
  c.keys('f R/S'); c.keys('625 R/S'); c.shows('473.75'); c.keys('159 R/S'); c.shows('124.25');
});
test('keycodes for prefixed instructions', () => {
  const c = calc().keys('f R/S f RDN g EEX STO + 1 g RDN 0 0 RCL . 2 f 4 STO EEX RCL g PMT');
  const lines = c.state.prog.slice(0, 6).map((l, i) => c.state.prog[i]);
  c.keys('g SST'); c.shows('06-  44 26');
  assert.deepEqual(lines.map((l) => l.join(' ')), ['43 26', '44 40 1', '43 33 0 0', '45 48 2', '42 4', '44 26']);
  c.keys('g SST g SST'); c.shows('04-  45 48 2');
});
test('factorial loop: conditionals, GTO, storage arithmetic, memory expansion', () => {
  const c = calc().keys('f R/S f RDN');
  c.keys('STO 1 1 STO 2 RCL 2 RCL 1 * STO 2 1 STO - 1 RCL 1 g CLX g RDN 1 4 g RDN 0 4 RCL 2');
  c.shows('14-  45 2');
  c.keys('g 9'); c.shows('P-15 r-19');
  c.keys('f R/S 5 R/S'); c.shows('120.00');
  c.keys('6 R/S'); c.shows('720.00');
  c.keys('RCL . 9'); c.shows('Error 6'); // R.9 converted to program lines
});
test('x≤y branch (max of two numbers) and GTO positioning / SST', () => {
  const c = calc().keys('f R/S f RDN g X<>Y X<>Y f R/S');
  c.keys('3 ENTER 7 R/S'); c.shows('7.00'); c.keys('7 ENTER 3 R/S'); c.shows('7.00');
  c.keys('5 ENTER 1 g RDN 0 1 SST'); assert.equal(c.state.pc, 2); // x≤y false → skips line 2
  c.keys('g RDN 5 0'); c.shows('Error 4');
});
test('R/S inside program halts and resumes; PSE pauses', () => {
  const c = calc().keys('f R/S f RDN 2 * R/S 3 + g R/S 1 + f R/S');
  c.keys('10 R/S'); c.shows('20.00'); c.keys('R/S'); c.shows('24.00');
  const p = calc().keys('f R/S f RDN 1 + g R/S 1 + f R/S');
  p.keys('1'); p.press('31'); const r = p.runSlice(1000); assert.equal(r, 'pause'); assert.equal(p.state.x, 2);
  let r2; do { r2 = p.runSlice(1000); } while (r2 === 'running' || r2 === 'pause'); p.shows('3.00');
});
test('program limit 99 lines → Error 4; CLEAR PRGM frees registers', () => {
  const c = calc().keys('f R/S f RDN');
  for (let k = 0; k < 99; k++) c.keys('1');
  c.shows('99-  1'); c.keys('1'); c.shows('Error 4'); c.keys('CLX g 9'); c.shows('P-99 r-07');
  c.keys('f RDN g 9'); c.shows('P-08 r-20');
});
test('runaway loop can be stopped by a keypress', () => {
  const c = calc().keys('f R/S f RDN 1 + g RDN 0 1 f R/S 0');
  c.press('31'); assert.equal(c.runSlice(500), 'running'); c.press('35'); assert.equal(c.isRunning(), false);
});
test('state persists through serialize()', () => {
  const c = calc().keys('f 4 g 7 g 4 STO EEX 12 STO . 3 1 n 2 ENTER 3 f R/S f RDN 7 f R/S 4 ENTER 5 S+');
  const d = calc(c.serialize());
  assert.equal(d.state.reg[13], 12); assert.equal(d.state.fix, 4); assert.equal(d.state.begin, true);
  assert.equal(d.state.dmy, true); assert.equal(d.state.compound, true); assert.deepEqual(d.state.prog[0], ['7']);
  assert.equal(d.state.reg[1], 1); assert.equal(d.state.y, 4); assert.equal(d.display(), '1.0000');
});
