import { createCalc, formatNumber } from './engine.js';
import { APP_NAME } from './config.js';
import { ROWS, BRACKETS } from './layout.js';
import { FN, PLAIN } from './keymap.js';
import { GUIDE, SIGMA_MAP } from './guide.js';

const STORE = APP_NAME + ':state:v1';
document.title = APP_NAME;
document.getElementById('brand').textContent = APP_NAME;
let saved = null; try { saved = localStorage.getItem(STORE); } catch { /* private mode */ }
const calc = createCalc(saved);
const $ = (id) => document.getElementById(id);

// ---------- build faceplate ----------
const keysEl = $('keys');
for (const [r, c1, c2, label] of BRACKETS) {
  const b = document.createElement('div'); b.className = 'bracket';
  b.style.gridRow = String(r + 1); b.style.gridColumn = `${c1 + 1} / ${c2 + 2}`; b.innerHTML = `<b>${label}</b>`; keysEl.appendChild(b);
}
ROWS.forEach((row, r) => row.forEach((k, c) => {
  if (!k) return;
  const [code, main, fl, gl, cls] = k;
  const cell = document.createElement('div'); cell.className = 'cell' + (cls ? ' ' + cls : '');
  cell.style.gridRow = code === '36' ? '3 / span 2' : String(r + 1); cell.style.gridColumn = String(c + 1);
  cell.innerHTML = `<div class="fl">${fl}</div><button class="key" data-code="${code}" aria-label="${main}${fl ? ', f ' + fl : ''}${gl ? ', g ' + gl : ''}"><span class="main">${main}</span>${gl || cls === 'num' || !cls || cls === 'op' ? `<span class="gl">${gl}</span>` : ''}</button>`;
  keysEl.appendChild(cell);
}));

// ---------- fit / rotate ----------
const calcEl = $('calc');
function fit() {
  const face = document.querySelector('.front'); const cs = getComputedStyle(face);
  const w = face.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const h = face.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const W = 1000, H = 590, portrait = h > w * 1.1;
  const s = portrait ? Math.min(h / W, w / H) : Math.min(w / W, h / H);
  const dx = (parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) / 2, dy = (parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / 2;
  calcEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) ${portrait ? 'rotate(90deg)' : ''} scale(${s * 0.98})`;
}
addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 200)); fit();

// ---------- rendering ----------
let pauseText = null, timer = null;
function render() {
  const d = $('disp');
  d.textContent = pauseText ?? calc.display();
  d.classList.toggle('blink', calc.isRunning() && pauseText === null);
  const a = calc.annunciators();
  for (const [id, on] of [['a-f', a.f], ['a-g', a.g], ['a-begin', a.begin], ['a-dmy', a.dmy], ['a-c', a.c], ['a-prgm', a.prgm]]) $(id).classList.toggle('on', !!on);
}
function save() { try { localStorage.setItem(STORE, calc.serialize()); } catch { /* quota/private */ } }
function transient() { // MEM, mantissa, BST line show briefly like holding the key
  const sp = calc.state.special; if (!sp || sp.type === 'date') return;
  clearTimeout(timer); timer = setTimeout(() => { calc.clearSpecial(); render(); }, 1300);
}
function runLoop() {
  if (!calc.isRunning()) { render(); save(); return; }
  const r = calc.runSlice(400);
  if (r === 'pause') {
    pauseText = formatNumber(calc.state.x, calc.state.fix, calc.state.sci); render();
    setTimeout(() => { pauseText = null; runLoop(); }, 1000); return;
  }
  render(); if (r === 'running') setTimeout(runLoop, 0); else save();
}
function press(code) {
  if (code === '41') { flip(true); return; }
  pauseText = null;
  calc.press(code);
  transient(); render(); save();
  if (calc.isRunning()) setTimeout(runLoop, 0);
  navigator.vibrate?.(6);
}

// ---------- input ----------
keysEl.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.key'); if (!b) return; e.preventDefault();
  b.classList.add('down'); press(b.dataset.code);
});
const up = () => document.querySelectorAll('.key.down').forEach((b) => b.classList.remove('down'));
addEventListener('pointerup', up); addEventListener('pointercancel', up);
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());
const KB = { Enter: '36', '+': '40', '-': '30', '*': '20', '/': '10', '.': '48', ',': '48', Backspace: '35', Delete: '35', f: '42', g: '43', s: '44', r: '45', n: '11', i: '12', e: '26', c: '16', x: '34' };
addEventListener('keydown', (e) => {
  if (document.body.classList.contains('showback') || e.metaKey || e.ctrlKey) return;
  const code = /^[0-9]$/.test(e.key) ? e.key : KB[e.key]; if (code) { e.preventDefault(); press(code); }
});

// ---------- back panel (quick reference) ----------
const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function glyph(t) {
  if (FN[t]) { const p = FN[t][0] === '42' ? 'f' : 'g'; return `<kbd class="k k${p}">${p}</kbd><kbd class="k t${p}">${esc(t)}</kbd>`; }
  if (PLAIN[t]) return `<kbd class="k">${esc(t)}</kbd>`;
  return `<span class="num">${esc(t)}</span>`;
}
function buildGuide() {
  const g = $('guide'); let html = `<p class="foot">Every example uses RPN keystrokes with the display set to 2 decimals (f 2). Results are what ${esc(APP_NAME)} shows.</p>`;
  for (const sec of GUIDE) {
    html += `<div class="sec"><div class="tagv">${sec.tag}</div><div>`;
    for (const it of sec.items) {
      html += `<div class="item"><div class="prob">${it.problem.map(esc).join('<br>')}</div><ol class="steps">`;
      for (const st of it.steps) html += `<li>${st.keys.map(glyph).join(' ')}${st.note ? ` <span class="note">→ ${esc(st.note)}</span>` : ''}${st.shows ? `<span class="res">${esc(st.shows)}</span>` : ''}</li>`;
      html += `</ol></div>`;
    }
    html += `</div></div>`;
  }
  html += `<div class="sec"><div class="tagv">Σ</div><div class="sigma">${SIGMA_MAP.map(([a, r]) => `<span>${a} → ${r}</span>`).join('')}</div></div>`;
  html += `<p class="foot">Program lines show row/column keycodes. Prefix keys (f, g, STO, RCL, GTO) combine into one line. Up to 99 lines; each 7 lines beyond 8 uses one storage register (g MEM shows P-nn r-nn).</p>`;
  g.innerHTML = html;
}
buildGuide();
function flip(toBack) {
  $('flipper').classList.toggle('flipped', toBack); document.body.classList.toggle('showback', toBack);
  if (toBack) document.querySelector('.back .scroll').scrollTop = 0;
}
$('flipBack').addEventListener('click', () => flip(false));
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

render();
if (location.hash === '#guide') flip(true);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
