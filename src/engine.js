// RPN12C engine — pure JS, no DOM. Keystroke-level emulation of a classic
// 12C-style financial calculator. Keys are identified by row/column keycodes
// (row 1-4, column 1-9,0); digit keys use the digit itself; "." is 48.
// Public API: createCalc(saved?) -> { press(code), display(), annunciators(), state,
//   serialize(), runSlice(n), stop(), isRunning() }

// ---------- numeric helpers ----------
export const MAX = 9.999999999e99;
export function r10(v) { // round to 10 significant digits, clamp overflow, flush underflow
  if (Number.isNaN(v)) throw calcErr(0);
  if (!Number.isFinite(v)) return v > 0 ? MAX : -MAX;
  if (v === 0 || Math.abs(v) < 1e-99) return 0;
  const r = Number(v.toPrecision(10));
  if (Math.abs(r) > MAX) return r > 0 ? MAX : -MAX;
  return r;
}
export function calcErr(n) { const e = new Error('Error ' + n); e.code = n; return e; }
const isInt = (v) => Number.isInteger(v);
const intg = (v) => Math.trunc(v);
const frac = (v) => r10(v - Math.trunc(v));

// ---------- display formatting ----------
function group(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
export function formatSci(x) {
  if (x === 0) return '0.000000 00';
  let [m, e] = Math.abs(x).toExponential(6).split('e'); e = +e;
  if (Math.abs(x) >= MAX) { m = '9.999999'; e = 99; }
  return (x < 0 ? '-' : '') + m + (e < 0 ? '-' : ' ') + String(Math.abs(e)).padStart(2, '0');
}
export function formatNumber(x, fix = 2, sci = false) {
  if (sci || Math.abs(x) >= MAX) return formatSci(x);
  const a = Math.abs(x);
  const idig = (v) => (v < 1 ? 1 : Math.floor(Math.log10(v)) + 1);
  if (a !== 0 && idig(a) > 10) return formatSci(x);
  let d = Math.min(fix, 10 - idig(a));
  let s = a.toFixed(Math.max(0, d));
  const id2 = s.split('.')[0].length;
  if (id2 > 10) return formatSci(x);
  if (10 - id2 < d) { d = 10 - id2; s = a.toFixed(d); }
  if (a !== 0 && Number(s) === 0) return formatSci(x);
  const [ip, fp = ''] = s.split('.');
  return (x < 0 ? '-' : '') + group(ip) + '.' + fp;
}
export function mantissa(x) { // all 10 digits, as shown by f PREFIX
  if (x === 0) return '0000000000';
  return Math.abs(x).toExponential(9).split('e')[0].replace('.', '');
}
export function roundToDisplay(x, fix, sci) {
  if (sci) return r10(Number(x.toPrecision(7)));
  const s = formatNumber(x, fix, false);
  if (/ \d\d$|-\d\d$/.test(s) && s.includes(' ') || /\d-\d\d$/.test(s)) return r10(Number(x.toPrecision(7)));
  return r10(Number(s.replace(/,/g, '')));
}

// ---------- calendar ----------
const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const dim = (y, m) => (m === 2 && leap(y) ? 29 : DIM[m - 1]);
export function dayNumber(y, m, d) { // days since civil epoch (proleptic Gregorian)
  y -= m <= 2 ? 1 : 0;
  const era = Math.floor(y / 400), yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  return era * 146097 + yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
}
export function fromDayNumber(z) {
  z += 719468; const era = Math.floor(z / 146097), doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153), d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  return { y: yoe + era * 400 + (m <= 2 ? 1 : 0), m, d };
}
// dayNumber above is offset so 1970-01-01 = 719468; normalise:
const DN = (y, m, d) => dayNumber(y, m, d) - 719468;
const MIN_DN = DN(1582, 10, 15), MAX_DN = DN(4046, 11, 25);
export function parseDate(x, dmy) {
  if (x <= 0) throw calcErr(8);
  const s = x.toFixed(6); const [a, b] = s.split('.');
  const p1 = +a, p2 = +b.slice(0, 2), y = +b.slice(2, 6);
  if (Math.abs(x - Number(s)) > 1e-9) throw calcErr(8);
  const m = dmy ? p2 : p1, d = dmy ? p1 : p2;
  if (m < 1 || m > 12 || d < 1 || d > dim(y, m)) throw calcErr(8);
  const n = DN(y, m, d); if (n < MIN_DN || n > MAX_DN) throw calcErr(8);
  return { y, m, d, n };
}
export function encodeDate({ y, m, d }, dmy) {
  const a = dmy ? d : m, b = dmy ? m : d;
  return r10(a + b / 100 + y / 1e6);
}
export const dow = (n) => ((n % 7) + 7 + 3) % 7 + 1; // 1 = Monday ... 7 = Sunday
export function days360(d1, d2) {
  const z1 = d1.d === 31 ? 30 : d1.d;
  const z2 = d2.d === 31 && d1.d >= 30 ? 30 : d2.d;
  return (d2.y - d1.y) * 360 + (d2.m - d1.m) * 30 + (z2 - z1);
}

// ---------- financial math ----------
// TVM with 12C odd-period handling. i in percent.
function tvmParts(n, ip, compound) {
  const N = intg(n), F = n - N;
  const A = F === 0 ? 1 : compound ? Math.exp(F * Math.log1p(ip)) : 1 + ip * F;
  const v = Math.exp(-N * Math.log1p(ip));
  const a = Math.abs(ip) < 1e-14 ? N : -Math.expm1(-N * Math.log1p(ip)) / ip;
  return { A, v, a };
}
export function tvmResidual(f, ip) {
  const { A, v, a } = tvmParts(f.n, ip, f.compound);
  return f.pv * A + (1 + ip * (f.begin ? 1 : 0)) * f.pmt * a + f.fv * v;
}
export function solveTVM(what, f) {
  const ip = f.i / 100, S = f.begin ? 1 : 0;
  if (what !== 'i' && ip <= -1) throw calcErr(5);
  if (what === 'n') {
    let n;
    if (ip === 0) { if (f.pmt === 0) throw calcErr(5); n = -(f.pv + f.fv) / f.pmt; }
    else {
      const k = (1 + ip * S) * f.pmt / ip, num = k + f.pv, den = k - f.fv;
      if (den === 0 || num / den <= 0) throw calcErr(5);
      n = -Math.log(num / den) / Math.log1p(ip);
    }
    if (!Number.isFinite(n) || n <= 0) throw calcErr(5);
    const nn = r10(n), fr = nn - Math.floor(nn);
    return fr < 0.005 ? Math.floor(nn) : Math.ceil(nn); // 12C n rounding
  }
  if (what === 'i') return r10(solveRate(f) * 100);
  const { A, v, a } = tvmParts(f.n, ip, f.compound), k = 1 + ip * S;
  if (what === 'pv') return r10(-(k * f.pmt * a + f.fv * v) / A);
  if (what === 'fv') return r10(-(f.pv * A + k * f.pmt * a) / v);
  if (what === 'pmt') { if (f.n === 0 || a === 0) throw calcErr(5); return r10(-(f.pv * A + f.fv * v) / (k * a)); }
  throw calcErr(5);
}
function bracketRoot(fn, grid) {
  let best = null;
  for (let k = 0; k < grid.length - 1; k++) {
    const a = grid[k], b = grid[k + 1], fa = fn(a), fb = fn(b);
    if (!Number.isFinite(fa) || !Number.isFinite(fb)) continue;
    if (fa === 0) return [a, a];
    if (fa * fb < 0) { const c = [a, b]; if (best === null || Math.abs(a) < Math.abs(best[0])) best = c; }
  }
  return best;
}
function bisect(fn, lo, hi) {
  if (lo === hi) return lo;
  let flo = fn(lo);
  for (let it = 0; it < 400; it++) {
    const m = (lo + hi) / 2, fm = fn(m);
    if (fm === 0 || hi - lo <= 1e-17 * Math.max(1, Math.abs(m))) return m;
    if ((fm < 0) === (flo < 0)) { lo = m; flo = fm; } else hi = m;
  }
  return (lo + hi) / 2;
}
const RATE_GRID = (() => { const g = [-0.999999, -0.99, -0.95, -0.9, -0.8, -0.6, -0.4, -0.2, -0.1, -0.05, -0.02, -0.01, -1e-3, -1e-6, 1e-12];
  for (let r = 1e-6; r < 100; r *= 1.25) g.push(r); return g; })();
function solveRate(f) {
  const signs = [f.pv, f.pmt, f.fv].filter((v) => v !== 0);
  if (f.n <= 0 && f.pmt === 0) throw calcErr(5);
  if (signs.length < 2 || signs.every((v) => v > 0) || signs.every((v) => v < 0)) throw calcErr(5);
  const fn = (r) => tvmResidual(f, r);
  const br = bracketRoot(fn, RATE_GRID); if (!br) throw calcErr(5);
  return bisect(fn, br[0], br[1]);
}
function cfSeries(cfs) { // [{v,n}] -> list of [amount, time]
  const out = []; let t = 0;
  for (const { v, n } of cfs) { for (let k = 0; k < n; k++) out.push([v, t++]); }
  return out;
}
export function npv(ratePct, cfs) {
  const r = ratePct / 100; if (r <= -1) throw calcErr(5);
  let s = 0; for (const [v, t] of cfSeries(cfs)) s += v * Math.exp(-t * Math.log1p(r));
  return r10(s);
}
export function irr(cfs) {
  const ser = cfSeries(cfs);
  if (!(ser.some(([v]) => v > 0) && ser.some(([v]) => v < 0))) throw calcErr(7);
  const fn = (r) => { let s = 0; for (const [v, t] of ser) s += v * Math.exp(-t * Math.log1p(r)); return s; };
  const br = bracketRoot(fn, RATE_GRID); if (!br) throw calcErr(7);
  return r10(bisect(fn, br[0], br[1]) * 100);
}
// Bonds: semiannual coupon, actual/actual, redemption 100.
function couponDate(mat, k) { // k semiannual periods before maturity
  let m = mat.m - 6 * k, y = mat.y; while (m < 1) { m += 12; y--; }
  if (mat.d > dim(y, m)) throw calcErr(8);
  return { y, m, d: mat.d, n: DN(y, m, mat.d) };
}
function bondSetup(settle, mat) {
  if (mat.n <= settle.n || mat.y - settle.y > 500) throw calcErr(8);
  let k = 0; while (true) { const c = couponDate(mat, k + 1); if (c.n <= settle.n) break; k++; }
  const next = couponDate(mat, k), prev = couponDate(mat, k + 1);
  const E = next.n - prev.n, DCS = settle.n - prev.n, DSC = E - DCS, DSM = mat.n - settle.n, N = k + 1;
  return { E, DCS, DSC, DSM, N };
}
export function bondPrice(yieldPct, cpn, b) {
  const RDV = 100, { E, DCS, DSC, DSM, N } = b, accrued = (DCS / E) * cpn / 2;
  let price;
  if (N === 1) price = (100 * (RDV + cpn / 2)) / (100 + (DSM / E) * yieldPct / 2) - accrued;
  else {
    const q = 1 + yieldPct / 200, w = DSC / E;
    let s = RDV / Math.pow(q, N - 1 + w);
    for (let K = 1; K <= N; K++) s += (cpn / 2) / Math.pow(q, K - 1 + w);
    price = s - accrued;
  }
  return { price: r10(price), accrued: r10(accrued) };
}
export function bondYield(price, cpn, b) {
  const fn = (y) => bondPrice(y, cpn, b).price - price;
  const grid = [-99.9, -50, -20, -5, 0, 1e-9]; for (let y = 0.01; y < 1e4; y *= 1.3) grid.push(y);
  const br = bracketRoot((y) => { const { E, DCS, DSC, DSM, N } = b; const acc = (DCS / E) * cpn / 2;
    if (N === 1) return (100 * (100 + cpn / 2)) / (100 + (DSM / E) * y / 2) - acc - price;
    const q = 1 + y / 200, w = DSC / E; let s = 100 / Math.pow(q, N - 1 + w);
    for (let K = 1; K <= N; K++) s += (cpn / 2) / Math.pow(q, K - 1 + w); return s - acc - price; }, grid);
  if (!br) throw calcErr(5);
  return r10(bisect((y) => fn(y), br[0], br[1]));
}
// Depreciation: returns {dep, rdv} for year j, each year rounded via rnd().
export function depreciation(method, { cost, salvage, life, factor }, j, rnd = (v) => v) {
  if (life <= 0 || !isInt(j) || j <= 0) throw calcErr(5);
  if (method === 'soyd' && life > 1e10) throw calcErr(5);
  let rdv = cost - salvage, rbv = cost, dep = 0; const L = life;
  const soydL = (() => { const W = intg(L), F = L - W; return (W + 1) * (W + 2 * F) / 2; })();
  for (let k = 1; k <= j; k++) {
    if (method === 'sl') dep = k <= Math.ceil(L) ? (cost - salvage) / L : 0;
    else if (method === 'soyd') dep = Math.max(0, (L - k + 1)) / soydL * (cost - salvage);
    else dep = rbv * factor / (100 * L);
    dep = rnd(dep);
    if ((rdv >= 0 && dep > rdv) || (rdv < 0 && dep < rdv)) dep = rdv;
    rdv = rnd(rdv - dep); rbv = rnd(rbv - dep);
  }
  return { dep: r10(dep), rdv: r10(rdv) };
}

// ---------- keyboard model ----------
export const GTO00 = ['43', '33', '0', '0'];
const DIGITS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
const FINKEYS = { 11: 'n', 12: 'i', 13: 'pv', 14: 'pmt', 15: 'fv' };
const ARITH = new Set(['10', '20', '30', '40']);
// Returns 'need' (more keys), 'done', or 'bad' (cancel prefix, reprocess key alone)
export function parseStep(pre) {
  const [a, b, c, d, e] = pre, L = pre.length;
  if (L === 1) return ['42', '43', '44', '45'].includes(a) ? 'need' : 'done';
  if (a === '42') return 'done';
  if (a === '43') {
    if (b !== '33') return 'done';
    if (L === 2) return 'need';
    if (c === '48') { if (L === 3) return 'need'; if (!DIGITS.has(pre[L - 1])) return 'bad'; return L === 5 ? 'done' : 'need'; }
    if (!DIGITS.has(pre[L - 1])) return 'bad'; return L === 4 ? 'done' : 'need';
  }
  if (a === '44' || a === '45') {
    if (L === 2) {
      if (DIGITS.has(b) || FINKEYS[b]) return 'done';
      if (b === '48') return 'need';
      if (a === '44' && b === '26') return 'done';
      if (a === '44' && ARITH.has(b)) return 'need';
      if (a === '45' && b === '43') return 'need';
      return 'bad';
    }
    if (a === '45' && b === '43') return ['13', '14', '15'].includes(c) ? 'done' : 'bad';
    if (b === '48') return DIGITS.has(c) ? 'done' : 'bad';
    // STO arith
    if (L === 3) { if (DIGITS.has(c)) return 'done'; if (c === '48') return 'need'; return 'bad'; }
    return DIGITS.has(d) ? 'done' : 'bad';
  }
  return 'done';
}
export function lineCodes(ins) {
  if (ins[0] === '43' && ins[1] === '33') return '43,33 ' + ins.slice(2).join('').padStart(2, '0');
  return ins.join(' ');
}
const NONPROG = new Set(['42 31', '32', '43 32', '42 33', '42 36', '43 9', '41']);

export function freshState() {
  return { x: 0, y: 0, z: 0, t: 0, lastX: 0, reg: Array(20).fill(0), nj: Array(20).fill(1),
    fin: { n: 0, i: 0, pv: 0, pmt: 0, fv: 0 }, begin: false, compound: false, dmy: false,
    fix: 2, sci: false, prgm: false, pc: 0, prog: Array.from({ length: 8 }, () => [...GTO00]),
    lift: true, entry: null, pre: [], prevFin: false, error: null, special: null, running: false };
}

export function createCalc(saved) {
  let s = freshState();
  if (saved) { try { const o = typeof saved === 'string' ? JSON.parse(saved) : saved; s = { ...s, ...o, pre: [], running: false, special: null }; } catch { /* ignore corrupt */ } }
  let pauseFlag = false;
  const regsAvail = () => 20 - (s.prog.length - 8) / 7;
  const regIdx = (ins, at) => (ins[at] === '48' ? 10 + +ins[at + 1] : +ins[at]);
  const chkReg = (k) => { if (k >= regsAvail()) throw calcErr(6); return k; };
  const fix = () => (v) => Number(roundToDisplay(v, s.fix, s.sci));
  // stack primitives
  const push = (v) => { s.t = s.z; s.z = s.y; s.y = s.x; s.x = v; };
  const finish = () => { if (s.entry) { s.entry = null; s.lift = true; } };
  const recall = (v) => { finish(); if (s.lift) push(v); else s.x = v; s.lift = true; };
  const fn1 = (f) => { finish(); const r = r10(f(s.x)); s.lastX = s.x; s.x = r; s.lift = true; };
  const fn2 = (f) => { finish(); const r = r10(f(s.y, s.x)); s.lastX = s.x; s.x = r; s.y = s.z; s.z = s.t; s.lift = true; };
  const two = (xv, yv) => { s.x = xv; s.y = yv; s.lift = true; }; // functions returning X and Y
  const entryVal = (e) => Number((e.neg ? '-' : '') + (e.m === '' || e.m === '.' ? '0' : e.m) + (e.exp ? 'e' + (e.eneg ? '-' : '') + e.exp : ''));
  const sumRegs = () => ({ n: s.reg[1], sx: s.reg[2], sx2: s.reg[3], sy: s.reg[4], sy2: s.reg[5], sxy: s.reg[6] });
  const cashFlows = () => {
    const n = s.fin.n; if (!isInt(n) || n < 0 || n > 20) throw calcErr(6); chkReg(n);
    const out = []; for (let j = 0; j <= n; j++) out.push({ v: s.reg[j], n: s.nj[j] }); return out;
  };

  function digitKey(k) {
    if (!s.entry) { if (s.lift) push(s.x); s.entry = { m: '', exp: null, neg: false, eneg: false }; s.lift = false; }
    const e = s.entry;
    if (k === '26') { if (e.exp === null) { if (e.m === '' || e.m === '.') e.m = '1'; e.exp = ''; } }
    else if (e.exp !== null) { if (k !== '48') e.exp = (e.exp + k).slice(-2); }
    else if (k === '48') { if (!e.m.includes('.')) e.m += '.'; }
    else if (e.m.replace('.', '').length < 10) e.m = (e.m === '0' ? '' : e.m) + k;
    s.x = r10(entryVal(e));
  }

  // ---- execute one complete instruction (array of keycodes) ----
  function exec(ins) {
    const k = ins.join(' ');
    const wasFin = s.prevFin; s.prevFin = false; s.special = null;
    if (DIGITS.has(k) || k === '48' || k === '26') { s.prevFin = wasFin && false; return digitKey(k); }
    if (k === '16') { // CHS
      if (s.entry) { const e = s.entry; if (e.exp !== null) e.eneg = !e.eneg; else e.neg = !e.neg; s.x = r10(entryVal(e)); }
      else { s.x = -s.x; s.lift = true; }
      return;
    }
    // financial keys
    if (FINKEYS[k]) {
      const name = FINKEYS[k];
      if (!wasFin) { finish(); s.fin[name] = s.x; s.lift = false; }
      else { const v = solveTVM(name, { ...s.fin, begin: s.begin, compound: s.compound }); s.fin[name] = v; recall(v); }
      s.prevFin = true; return;
    }
    switch (k) {
      case '36': finish(); push(s.x); s.lift = false; return;                    // ENTER
      case '35': s.entry = null; s.x = 0; s.lift = false; return;                // CLx
      case '40': return fn2((a, b) => a + b);
      case '30': return fn2((a, b) => a - b);
      case '20': return fn2((a, b) => a * b);
      case '10': return fn2((a, b) => { if (b === 0) throw calcErr(0); return a / b; });
      case '21': return fn2((a, b) => { if (a === 0 && b <= 0) throw calcErr(0); if (a < 0 && !isInt(b)) throw calcErr(0); return Math.pow(a, b); });
      case '22': return fn1((v) => { if (v === 0) throw calcErr(0); return 1 / v; });
      case '23': finish(); { if (s.y === 0) throw calcErr(0); const r = r10(s.x / s.y * 100); s.lastX = s.x; s.x = r; s.lift = true; } return; // %T
      case '24': finish(); { if (s.y === 0) throw calcErr(0); const r = r10((s.x - s.y) / s.y * 100); s.lastX = s.x; s.x = r; s.lift = true; } return; // Δ%
      case '25': finish(); { const r = r10(s.y * s.x / 100); s.lastX = s.x; s.x = r; s.lift = true; } return; // %
      case '33': finish(); [s.x, s.y, s.z, s.t] = [s.y, s.z, s.t, s.x]; s.lift = true; return; // R↓
      case '34': finish(); [s.x, s.y] = [s.y, s.x]; s.lift = true; return; // x≷y
      case '49': case '43 49': { // Σ+ / Σ-
        finish(); const sg = k === '49' ? 1 : -1, x = s.x, y = s.y; chkReg(6);
        const R = s.reg; R[1] = r10(R[1] + sg); R[2] = r10(R[2] + sg * x); R[3] = r10(R[3] + sg * x * x);
        R[4] = r10(R[4] + sg * y); R[5] = r10(R[5] + sg * y * y); R[6] = r10(R[6] + sg * x * y);
        s.lastX = x; s.x = R[1]; s.lift = false; return;
      }
      case '31': s.running = !s.running; finish(); return; // R/S (manual press handled by press())
      case '41': return;
    }
    // f-prefixed
    if (ins[0] === '42') {
      const b = ins[1];
      if (DIGITS.has(b)) { finish(); s.fix = +b; s.sci = false; return; }
      switch (b) {
        case '48': finish(); s.sci = true; return;
        case '11': { // AMORT
          finish(); const kk = s.x; if (!isInt(kk) || kk <= 0) throw calcErr(5);
          const ip = s.fin.i / 100, rnd = fix(), sign = s.fin.pmt < 0 ? -1 : 1; let bal = s.fin.pv, I = 0, P = 0;
          for (let j = 0; j < kk; j++) {
            const ii = (j === 0 && s.fin.n === 0 && s.begin) ? 0 : rnd(Math.abs(bal * ip)) * sign;
            const pr = r10(s.fin.pmt - ii); I = r10(I + ii); P = r10(P + pr); bal = r10(bal + pr);
          }
          s.fin.pv = bal; s.fin.n = r10(s.fin.n + kk); s.lastX = kk; s.t = s.y; s.z = kk; s.y = P; s.x = I; s.lift = true; return;
        }
        case '12': { // INT
          finish(); const { n, i, pv } = s.fin; const i360 = r10(-pv * i / 100 * n / 360), i365 = r10(-pv * i / 100 * n / 365);
          s.lastX = s.x; s.t = s.z; s.z = i365; s.y = r10(-pv); s.x = i360; s.lift = true; return;
        }
        case '13': { finish(); const v = npv(s.fin.i, cashFlows()); s.fin.pv = v; recall(v); return; }
        case '14': finish(); s.lastX = s.x; s.x = roundToDisplay(s.x, s.fix, s.sci); s.lift = true; return; // RND
        case '15': { finish(); const v = irr(cashFlows()); s.fin.i = v; recall(v); return; }
        case '21': case '22': { // PRICE / YTM
          finish(); const st = parseDate(s.y, s.dmy), mt = parseDate(s.x, s.dmy), b2 = bondSetup(st, mt);
          s.lastX = s.x;
          if (b === '21') { const { price, accrued } = bondPrice(s.fin.i, s.fin.pmt, b2); s.fin.pv = price; two(price, accrued); }
          else { const y = bondYield(s.fin.pv, s.fin.pmt, b2); s.fin.i = y; s.x = y; s.y = s.z; s.z = s.t; s.lift = true; }
          return;
        }
        case '23': case '24': case '25': { // SL SOYD DB
          finish(); const m = { 23: 'sl', 24: 'soyd', 25: 'db' }[b];
          const r = depreciation(m, { cost: s.fin.pv, salvage: s.fin.fv, life: s.fin.n, factor: s.fin.i }, s.x, fix());
          s.lastX = s.x; two(r.dep, r.rdv); return;
        }
        case '31': s.prgm = !s.prgm; finish(); s.pc = 0; return; // P/R
        case '32': finish(); for (let j = 1; j <= 6; j++) s.reg[j] = 0; s.x = s.y = s.z = s.t = 0; return; // CLEAR Σ
        case '33': finish(); s.pc = 0; if (s.prgm) { s.prog = Array.from({ length: 8 }, () => [...GTO00]); } return; // CLEAR PRGM
        case '34': finish(); s.fin = { n: 0, i: 0, pv: 0, pmt: 0, fv: 0 }; return; // CLEAR FIN
        case '35': finish(); s.reg = Array(20).fill(0); s.nj = Array(20).fill(1); s.fin = { n: 0, i: 0, pv: 0, pmt: 0, fv: 0 };
          s.x = s.y = s.z = s.t = s.lastX = 0; return; // CLEAR REG
        case '36': s.special = { type: 'mantissa', text: mantissa(s.x) }; return; // PREFIX (shows mantissa)
      }
      return; // unassigned f-key: no-op
    }
    if (ins[0] === '43') {
      const b = ins[1];
      switch (b) {
        case '11': finish(); { const v = r10(s.x * 12); if (Math.abs(v) >= MAX) throw calcErr(1); s.lastX = s.x; s.x = v; s.fin.n = v; } s.lift = false; s.prevFin = true; return;
        case '12': finish(); { const v = r10(s.x / 12); s.lastX = s.x; s.x = v; s.fin.i = v; } s.lift = false; s.prevFin = true; return;
        case '13': finish(); s.reg[0] = s.x; s.nj[0] = 1; s.fin.n = 0; s.lift = true; return; // CFo
        case '14': { finish(); const j = s.fin.n + 1; if (!isInt(j) || j < 1 || j > 19) throw calcErr(6); chkReg(j); s.reg[j] = s.x; s.nj[j] = 1; s.fin.n = j; s.lift = true; return; }
        case '15': { finish(); const j = s.fin.n, v = s.x; if (!isInt(j) || j < 0 || j > 19) throw calcErr(6); if (!isInt(v) || v < 0 || v > 99) throw calcErr(6); s.nj[j] = v; s.lift = true; return; }
        case '16': { // DATE
          finish(); const d0 = parseDate(s.y, s.dmy), nn = d0.n + intg(s.x);
          if (nn < MIN_DN || nn > MAX_DN) throw calcErr(8);
          const dt = fromDayNumber(nn + 719468 - 719468); const enc = encodeDate(dt, s.dmy);
          s.lastX = s.x; s.x = enc; s.y = s.z; s.z = s.t; s.lift = true;
          const a = s.dmy ? dt.d : dt.m, bb = s.dmy ? dt.m : dt.d;
          s.special = { type: 'date', text: `${a},${String(bb).padStart(2, '0')},${dt.y}  ${dow(nn)}` }; return;
        }
        case '7': finish(); s.begin = true; return;
        case '8': finish(); s.begin = false; return;
        case '9': s.special = { type: 'mem', text: `P-${String(s.prog.length).padStart(2, '0')} r-${String(regsAvail()).padStart(2, '0')}` }; return;
        case '21': return fn1((v) => { if (v < 0) throw calcErr(0); return Math.sqrt(v); });
        case '22': return fn1((v) => Math.exp(v));
        case '23': return fn1((v) => { if (v <= 0) throw calcErr(0); return Math.log(v); });
        case '24': return fn1((v) => frac(v));
        case '25': return fn1((v) => intg(v));
        case '26': { // ΔDYS
          finish(); const d1 = parseDate(s.y, s.dmy), d2 = parseDate(s.x, s.dmy);
          s.lastX = s.x; two(d2.n - d1.n, days360(d1, d2)); return;
        }
        case '4': finish(); s.dmy = true; return;
        case '5': finish(); s.dmy = false; return;
        case '6': { finish(); const { sx, sxy } = sumRegs(); if (sx === 0) throw calcErr(2); recall(r10(sxy / sx)); return; } // x̄w
        case '20': return fn1((v) => v * v);
        case '31': finish(); pauseFlag = true; return; // PSE
        case '34': case '35': return; // x≤y, x=0 handled by runner (no-op when typed in run mode)
        case '36': return recall(s.lastX); // LSTx
        case '1': case '2': { // x̂,r  ŷ,r
          finish(); const { n, sx, sx2, sy, sy2, sxy } = sumRegs(); if (n === 0) throw calcErr(2);
          const M = n * sx2 - sx * sx, N = n * sy2 - sy * sy, P = n * sxy - sx * sy;
          if (M === 0) throw calcErr(2);
          const B = P / M, A = (sy - B * sx) / n; const MN = M * N;
          const r = MN > 0 ? r10(P / Math.sqrt(MN)) : (() => { throw calcErr(2); })();
          const est = b === '2' ? r10(A + B * s.x) : (B === 0 ? (() => { throw calcErr(2); })() : r10((s.x - A) / B));
          s.lastX = s.x; s.t = s.z; s.z = s.y; two(est, r); return;
        }
        case '3': return fn1((v) => { if (!isInt(v) || v < 0) throw calcErr(0); if (v > 69) return Infinity; let f = 1; for (let q = 2; q <= v; q++) f *= q; return f; });
        case '0': { finish(); const { n, sx, sy } = sumRegs(); if (n === 0) throw calcErr(2); const mx = r10(sx / n), my = r10(sy / n); if (s.lift) push(my); else s.x = my; push(mx); s.lift = true; return; }
        case '48': { finish(); const { n, sx, sx2, sy, sy2 } = sumRegs(); if (n === 0 || n === 1) throw calcErr(2);
          const vx = n * sx2 - sx * sx, vy = n * sy2 - sy * sy; if (vx < 0 || vy < 0) throw calcErr(2);
          const a = r10(Math.sqrt(vx / (n * (n - 1)))), c = r10(Math.sqrt(vy / (n * (n - 1)))); if (s.lift) push(c); else s.x = c; push(a); s.lift = true; return; }
        case '33': { // GTO nn (run-mode positioning)
          const nn = +(ins[2] === '48' ? ins.slice(3) : ins.slice(2)).join(''); if (nn > s.prog.length) throw calcErr(4);
          finish(); s.pc = nn; return;
        }
      }
      return;
    }
    if (ins[0] === '44') { // STO
      finish();
      const b = ins[1];
      if (FINKEYS[b]) { s.fin[FINKEYS[b]] = s.x; s.lift = false; return; }
      if (b === '26') { s.compound = !s.compound; return; }
      if (ARITH.has(b)) {
        const r = regIdx(ins, 2); if (r > 4) throw calcErr(4); chkReg(r);
        const x = s.x, cur = s.reg[r];
        let v = b === '40' ? cur + x : b === '30' ? cur - x : b === '20' ? cur * x : (x === 0 ? (() => { throw calcErr(0); })() : cur / x);
        if (Math.abs(v) > MAX) throw calcErr(1); s.reg[r] = r10(v); s.lift = true; return;
      }
      const r = chkReg(regIdx(ins, 1)); s.reg[r] = s.x; s.lift = true; return;
    }
    if (ins[0] === '45') { // RCL
      const b = ins[1];
      if (FINKEYS[b]) return recall(s.fin[FINKEYS[b]]);
      if (b === '43') {
        if (ins[2] === '13') return recall(s.reg[0]);
        if (ins[2] === '14') { const j = s.fin.n; if (!isInt(j) || j < 0 || j > 19) throw calcErr(6); const v = s.reg[j]; s.fin.n = Math.max(0, j - 1); return recall(v); }
        if (ins[2] === '15') { const j = s.fin.n; if (!isInt(j) || j < 0 || j > 19) throw calcErr(6); return recall(s.nj[j]); }
      }
      return recall(s.reg[chkReg(regIdx(ins, 1))]);
    }
  }

  // ---- program memory ----
  function storeLine(ins) {
    const line = s.pc + 1;
    if (line > 99) throw calcErr(4);
    if (line > s.prog.length) {
      const lost = regsAvail() - 1; s.reg[lost] = 0; // convert last register to 7 lines
      for (let q = 0; q < 7; q++) s.prog.push([...GTO00]);
    }
    s.prog[line - 1] = ins; s.pc = line;
  }
  // Execute the line at s.pc while running. Returns 'cont' | 'halt' | 'pause'
  function step() {
    if (s.pc === 0 || s.pc > s.prog.length) s.pc = 1;
    const line = s.pc, ins = s.prog[line - 1], k = ins.join(' ');
    let next = line + 1;
    const snap = clone(s);
    try {
      if (ins[0] === '43' && ins[1] === '33') {
        const nn = +ins.slice(2).join(''); if (nn > s.prog.length) throw calcErr(4);
        finish(); if (nn === 0) { s.pc = 0; return 'halt'; } s.pc = nn; return 'cont';
      }
      if (k === '31') { finish(); s.pc = next > s.prog.length ? 0 : next; return 'halt'; }
      if (k === '43 34' || k === '43 35') { finish(); const ok = k === '43 34' ? s.x <= s.y : s.x === 0; if (!ok) next++; }
      else { pauseFlag = false; exec(ins); if (s.special && s.special.type === 'date') pauseFlag = true; }
    } catch (e) { if (e.code === undefined) throw e; Object.assign(s, snap); s.error = e.code; s.running = false; return 'halt'; }
    if (next > s.prog.length) { finish(); s.pc = 0; return 'halt'; }
    s.pc = next;
    if (pauseFlag) { pauseFlag = false; return 'pause'; }
    return 'cont';
  }
  function runSlice(maxSteps = 5000) {
    for (let q = 0; q < maxSteps && s.running; q++) {
      const r = step();
      if (r === 'halt') { s.running = false; return 'halt'; }
      if (r === 'pause') return 'pause';
    }
    return s.running ? 'running' : 'halt';
  }

  // ---- keyboard entry point ----
  function press(code) {
    code = String(code);
    if (s.running) { s.running = false; return; } // any key halts a running program
    if (s.error !== null) { s.error = null; s.pre = []; return; }
    s.special = null;
    let pre = [...s.pre, code];
    // f/g prefix switching
    if (pre.length === 2 && (pre[0] === '42' || pre[0] === '43') && (code === '42' || code === '43')) { s.pre = [code]; return; }
    let st = parseStep(pre);
    if (st === 'bad') { pre = [code]; st = parseStep(pre); }
    if (st === 'need') { s.pre = pre; return; }
    s.pre = [];
    const ins = pre, key = ins.join(' ');
    if (s.prgm) {
      if (key === '42 31') { s.prgm = false; s.pc = 0; return; }
      if (key === '32') { s.pc = s.pc >= s.prog.length ? 0 : s.pc + 1; return; }
      if (key === '43 32') { s.pc = s.pc === 0 ? s.prog.length : s.pc - 1; return; }
      if (key === '42 33') { s.prog = Array.from({ length: 8 }, () => [...GTO00]); s.pc = 0; return; }
      if (key === '43 9') { exec(ins); return; }
      if (key === '42 36' || key === '41') return;
      if (ins[0] === '43' && ins[1] === '33' && ins[2] === '48') { const nn = +ins.slice(3).join(''); if (nn > s.prog.length) { s.error = 4; return; } s.pc = nn; return; }
      try { storeLine(ins); } catch (e) { s.error = e.code; }
      return;
    }
    // run mode
    if (key === '31') { finish(); s.running = true; return; } // R/S starts; UI calls runSlice()
    if (key === '32') { s.running = true; const r = step(); s.running = false; return r; } // SST executes one line
    if (key === '43 32') { s.pc = s.pc === 0 ? s.prog.length : s.pc - 1; s.special = { type: 'line', text: lineDisplay(s.pc) }; return; }
    const snap = clone(s);
    try { pauseFlag = false; exec(ins); }
    catch (e) { if (e.code === undefined) throw e; Object.assign(s, snap); if (s.entry) { s.entry = null; s.lift = true; } s.pre = []; s.error = e.code; }
  }

  function lineDisplay(pc) { return pc === 0 ? '00-' : String(pc).padStart(2, '0') + '-  ' + lineCodes(s.prog[pc - 1]); }
  function entryDisplay(e) {
    const [ip, fp] = e.m.split('.'); const intPart = group(ip === '' || ip === undefined ? '0' : ip);
    let txt = (e.neg ? '-' : '') + intPart + '.' + (fp ?? '');
    if (e.exp !== null) txt += (e.eneg ? '-' : ' ') + e.exp.padStart(2, '0');
    return txt;
  }
  function display() {
    if (s.error !== null) return 'Error ' + s.error;
    if (s.running) return 'running';
    if (s.special) return s.special.text;
    if (s.prgm) return lineDisplay(s.pc);
    if (s.entry) return entryDisplay(s.entry);
    return formatNumber(s.x, s.fix, s.sci);
  }
  function annunciators() {
    const p = s.pre[0];
    return { f: p === '42', g: p === '43', begin: s.begin, dmy: s.dmy, c: s.compound, prgm: s.prgm, running: s.running,
      sto: p === '44', rcl: p === '45' };
  }
  function serialize() { const o = clone(s); delete o.pre; delete o.running; delete o.special; return JSON.stringify(o); }
  return { press, display, annunciators, serialize, runSlice, stop() { s.running = false; },
    isRunning: () => s.running, clearSpecial() { s.special = null; }, get state() { return s; }, regsAvail };
}
const clone = (o) => JSON.parse(JSON.stringify(o));
