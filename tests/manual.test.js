// Examples modelled on the published 12C owner's handbook, run keystroke-by-keystroke.
import test from 'node:test'; import assert from 'node:assert/strict';
import { calc, near } from './helpers.js';

test('display formats: FIX, sci, mantissa, f0 trailing point', () => {
  const c = calc().keys('19.8745632 ENTER 5 -'); c.shows('14.87');
  c.keys('f 4'); c.shows('14.8746'); c.keys('f 1'); c.shows('14.9'); c.keys('f 0'); c.shows('15.');
  c.keys('f 9'); c.shows('14.87456320'); c.keys('f .'); c.shows('1.487456 01');
  c.keys('f ENTER'); c.shows('1487456320'); c.keys('f 2'); c.shows('14.87');
});
test('RND / INTG / FRAC / LSTx', () => {
  const c = calc().keys('.258 1/x'); c.shows('3.88');
  c.keys('f ENTER'); c.shows('3875968992');
  c.keys('f PMT'); c.shows('3.88'); c.keys('f ENTER'); c.shows('3880000000');
  c.keys('g %'); c.shows('3.00'); c.keys('g ENTER'); c.shows('3.88'); c.keys('g D%'); c.shows('0.88');
});
test('powers', () => {
  calc().keys('2 ENTER 1.4 y^x').shows('2.64');
  calc().keys('2 ENTER 1.4 CHS y^x').shows('0.38');
  calc().keys('2 CHS ENTER 3 y^x').shows('-8.00');
  calc().keys('2 ENTER 3 1/x y^x').shows('1.26');
});
test('10-digit arithmetic like the 12C', () => {
  const c = calc().keys('3 1/x 3 *'); assert.equal(c.state.x, 0.9999999999); c.shows('1.00');
  assert.equal(calc().keys('.1 ENTER .2 +').state.x, 0.3);
});
test('stack lift: ENTER, CLx, after fin store, Σ+', () => {
  assert.equal(calc().keys('5 ENTER 6').state.y, 5);
  const c = calc().keys('9 ENTER 8 CLX 2 +'); assert.equal(c.state.x, 11);
  const d = calc().keys('7 ENTER 100000 PV 5'); assert.equal(d.state.y, 7); assert.equal(d.state.x, 5); // no lift after PV store
  const e = calc().keys('7 ENTER 100000 PV FV 5'); assert.equal(e.state.y, -100000); // computing FV re-enables lift
  const f = calc().keys('1 2 ENTER 3 S+ 4'); assert.equal(f.state.x, 4); assert.equal(f.state.y, 12);
  const g = calc().keys('1 ENTER 2 ENTER 3 ENTER 4 RDN'); assert.deepEqual([g.state.x, g.state.y, g.state.z, g.state.t], [3, 2, 1, 4]);
  calc().keys('5 ENTER ENTER ENTER * * *').shows('625.00');
});
test('EEX entry and overflow', () => {
  const c = calc().keys('1.7814 EEX 12'); c.shows('1.7814 12');
  c.keys('CHS'); c.shows('1.7814-12'); c.keys('ENTER'); c.shows('1.781400-12');
  calc().keys('9 EEX 99 ENTER 10 *').shows('9.999999 99');
});
test('percent functions (handbook values)', () => {
  calc().keys('300 ENTER 14 %').shows('42.00');
  calc().keys('58.5 ENTER 53.25 D%').shows('-8.97');
  calc().keys('3.92 ENTER 2.36 %T').shows('60.20');
});
test('storage registers, .n registers, storage arithmetic', () => {
  const c = calc().keys('42 STO 3 7 STO . 5 CLX RCL 3 RCL . 5 +'); c.shows('49.00');
  c.keys('10 STO + 3 RCL 3'); c.shows('52.00');
  c.keys('2 STO * 3 RCL 3'); c.shows('104.00');
  c.keys('4 STO / 3 RCL 3'); c.shows('26.00');
  c.keys('1 STO - 3 RCL 3'); c.shows('25.00');
  calc().keys('1 STO + 5').shows('Error 4');
  calc().keys('1 STO / 0').state.reg; // R0 / 1 fine
  calc().keys('0 STO / 1').shows('Error 0');
});
test('error display restores state; any key clears', () => {
  const c = calc().keys('5 ENTER 0 /'); c.shows('Error 0'); c.keys('CLX'); c.shows('0.00');
  assert.equal(c.state.y, 5); // state before the failed op
  calc().keys('1 CHS g y^x').shows('Error 0'); calc().keys('0 g %T').shows('Error 0');
  calc().keys('2.5 g 3').shows('Error 0'); calc().keys('5 g 3').shows('120.00');
  calc().keys('70 g 3').shows('9.999999 99');
});
test('simple interest f INT (handbook)', () => {
  const c = calc().keys('60 n 7 i 450 CHS PV f i'); c.shows('5.25'); c.keys('+'); c.shows('455.25');
  const d = calc().keys('60 n 7 i 450 CHS PV f i RDN X<>Y'); d.shows('5.18'); d.keys('+'); d.shows('455.18');
});
test('n rounds up to an integer; final payment (handbook)', () => {
  const c = calc().keys('f X<>Y 10.5 g i 35000 PV 325 CHS PMT n'); c.shows('328.00');
  c.keys('12 /'); c.shows('27.33');
  c.keys('328 n FV'); c.shows('181.89'); c.keys('RCL PMT +'); c.shows('-143.11');
  c.keys('327 n FV'); c.shows('-141.87'); c.keys('RCL PMT +'); c.shows('-466.87');
});
test('TVM basics: mortgage, begin mode, i solve', () => {
  calc().keys('29 g n 14.25 g i 43400 PV PMT').shows('-523.99');
  calc().keys('30 g n 6.5 g i 300000 PV PMT').shows('-1,896.20');
  const c = calc().keys('8 n 10000 FV 6000 CHS PV i'); c.shows('6.59');
  calc().keys('g 7 10 n 6 i 100 CHS PMT FV').shows('1,397.16');
});
test('odd-period loans (handbook, compound and simple)', () => {
  const c = calc().keys('f X<>Y g 5 g 8 STO EEX 2.152004 ENTER 3.012004 g EEX');
  c.shows('15.00'); c.keys('X<>Y'); c.shows('16.00');
  c.keys('30 / 36 + n 15 g i 4500 PV PMT'); c.shows('-157.03');
  const d = calc().keys('f X<>Y 7.192004 ENTER 8.012004 g EEX'); d.shows('13.00');
  d.keys('30 / 42 + n 3950 PV 120 CHS PMT i'); d.shows('1.16'); d.keys('12 *'); d.shows('13.95');
  assert.equal(c.annunciators().c, true); assert.equal(d.annunciators().c, false);
});
test('AMORT (handbook)', () => {
  const c = calc().keys('f X<>Y 13.25 g i 50000 PV 573.35 CHS PMT g 8 12 f n');
  c.shows('-6,608.89'); c.keys('X<>Y'); c.shows('-271.31'); c.keys('RCL PV'); c.shows('49,728.69'); c.keys('RCL n'); c.shows('12.00');
  c.keys('12 f n'); c.shows('-6,570.72'); c.keys('X<>Y'); c.shows('-309.48'); c.keys('RDN RDN'); c.shows('12.00');
  c.keys('RCL PV'); c.shows('49,419.21'); c.keys('RCL n'); c.shows('24.00');
  c.keys('50000 PV 0 n 1 f n'); c.shows('-552.08'); c.keys('X<>Y'); c.shows('-21.27');
  c.keys('1 f n'); c.shows('-551.85'); c.keys('X<>Y'); c.shows('-21.50');
  const d = calc().keys('13.25 g i 30 g n 50000 PV PMT'); d.shows('-562.89');
  d.keys('0 n 1 f n X<>Y'); d.shows('-10.81'); d.keys('RCL PV'); d.shows('49,989.19');
});
test('NPV / IRR with grouped cash flows (handbook)', () => {
  const c = calc().keys('f CLX 80000 CHS g PV 500 CHS g PMT 4500 g PMT 5500 g PMT 4500 g PMT 130000 g PMT');
  c.keys('RCL n'); c.shows('5.00'); c.keys('13 i f PV'); c.shows('212.18');
  const d = calc().keys('f CLX 79000 CHS g PV 14000 g PMT 11000 g PMT 10000 g PMT 3 g FV 9100 g PMT 9000 g PMT 2 g FV 4500 g PMT 100000 g PMT');
  d.keys('RCL n'); d.shows('7.00'); d.keys('13.5 i f PV'); d.shows('907.77');
  d.keys('f FV'); d.shows('13.72');
  d.keys('9000 STO 2 13.5 i f PV'); d.shows('-644.75');
  d.keys('5 n 4 g FV 7 n f PV'); d.shows('-1,857.21');
  calc().keys('f CLX 100 g PV 100 g PMT f FV').shows('Error 7');
});
test('bonds PRICE and YTM (handbook)', () => {
  const c = calc().keys('8.25 i 6.75 PMT g 5 4.282004 ENTER 6.042018 f y^x'); c.shows('87.62');
  c.keys('+'); c.shows('90.31');
  const d = calc().keys('3 ENTER 8 / 88 + PV 6.75 PMT 4.282004 ENTER 6.042018 f 1/x'); d.shows('8.15');
  calc().keys('8 i 6 PMT 6.012004 ENTER 3.312010 f y^x').shows('Error 8'); // no matching coupon date
});
test('depreciation SL / SOYD / DB (handbook DB values)', () => {
  const c = calc().keys('10000 PV 500 FV 5 n 200 i 1 f %'); c.shows('4,000.00'); c.keys('X<>Y'); c.shows('5,500.00');
  c.keys('2 f %'); c.shows('2,400.00'); c.keys('X<>Y'); c.shows('3,100.00');
  c.keys('3 f %'); c.shows('1,440.00'); c.keys('X<>Y'); c.shows('1,660.00');
  const s = calc().keys('10000 PV 500 FV 5 n 1 f %T'); s.shows('1,900.00'); s.keys('X<>Y'); s.shows('7,600.00');
  s.keys('3 f %T X<>Y'); s.shows('3,800.00');
  const y = calc().keys('10000 PV 500 FV 5 n 1 f D%'); y.shows('3,166.67'); y.keys('X<>Y'); y.shows('6,333.33');
  y.keys('5 f D%'); y.shows('633.33'); y.keys('X<>Y'); y.shows('0.00');
  calc().keys('10000 PV 5 n 1.5 f %T').shows('Error 5');
});
test('dates: DATE with weekday, ΔDYS actual and 30/360 (handbook)', () => {
  const c = calc().keys('g 4 14.052004 ENTER 120 g CHS'); c.shows('11,09,2004  6');
  assert.equal(c.state.x, 11.092004); assert.equal(c.annunciators().dmy, true);
  const d = calc().keys('g 5 6.032004 ENTER 10.142005 g EEX'); d.shows('498.00'); d.keys('X<>Y'); d.shows('491.00');
  calc().keys('2.302004 ENTER 5 g CHS').shows('Error 8');
  calc().keys('1.012000 ENTER 1 CHS g CHS').shows('12,31,1999  5');
});
test('statistics (handbook salesperson + gasoline examples)', () => {
  const c = calc().keys('f SST');
  for (const [h, sales] of [[32, 17000], [40, 25000], [45, 26000], [40, 20000], [38, 21000], [50, 28000], [35, 15000]]) c.keys(`${h} ENTER ${sales} S+`);
  c.shows('7.00');
  c.keys('g 0'); c.shows('21,714.29'); c.keys('X<>Y'); c.shows('40.00');
  c.keys('g .'); c.shows('4,820.59'); c.keys('X<>Y'); c.shows('6.03');
  c.keys('48 g 1'); c.shows('28,818.93'); c.keys('X<>Y'); c.shows('0.90');
  c.keys('0 g 2'); c.shows('15.55');
  c.keys('g 0 S+ g .'); c.shows('4,463.00'); c.keys('X<>Y'); c.shows('5.58');
  const w = calc().keys('f SST 1.16 ENTER 15 S+ 1.24 ENTER 7 S+ 1.20 ENTER 10 S+ 1.18 ENTER 17 S+ g 6'); w.shows('1.19');
  assert.deepEqual(w.state.reg.slice(1, 7), [4, 49, 15 * 15 + 49 + 100 + 289, 4.78, 1.16 ** 2 + 1.24 ** 2 + 1.44 + 1.18 ** 2, 58.14].map((v) => Number(v.toPrecision(10))));
  calc().keys('f SST g 0').shows('Error 2');
  calc().keys('f SST 1 S+ g .').shows('Error 2');
  const m = calc().keys('f SST 3 ENTER 4 S+ 3 ENTER 4 S+ 3 ENTER 4 g S+ RCL 1'); m.shows('1.00');
});
