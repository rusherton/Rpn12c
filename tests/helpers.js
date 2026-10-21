import { createCalc } from '../src/engine.js';
import { toCodes } from '../src/keymap.js';
import assert from 'node:assert/strict';
export function calc(saved) {
  const c = createCalc(saved);
  c.keys = (seq) => { for (const k of toCodes(seq)) { c.press(k); if (c.isRunning()) { let r; let guard = 0; do { r = c.runSlice(100000); if (++guard > 50) throw new Error('runaway'); } while (r === 'running' || r === 'pause'); } } return c; };
  c.shows = (txt) => assert.equal(c.display(), txt);
  return c;
}
export const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} != ${b}`);
