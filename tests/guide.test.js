import test from 'node:test'; import assert from 'node:assert/strict';
import { GUIDE } from '../src/guide.js';
import { labelsToCodes } from '../src/keymap.js';
import { createCalc } from '../src/engine.js';
for (const sec of GUIDE) for (const [n, it] of sec.items.entries()) {
  test(`back-panel guide ${sec.tag} #${n + 1} gives the printed results`, () => {
    const c = createCalc();
    for (const st of it.steps) { for (const k of labelsToCodes(st.keys)) c.press(k); if (st.shows) assert.equal(c.display(), st.shows, st.keys.join(' ')); }
  });
}
