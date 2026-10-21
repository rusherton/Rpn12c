// Human-readable key names -> keycodes (row/column). Pure data; shared by UI and tests.
export const KEY = {
  n: '11', i: '12', PV: '13', PMT: '14', FV: '15', CHS: '16', '7': '7', '8': '8', '9': '9', '/': '10',
  'y^x': '21', '1/x': '22', '%T': '23', 'D%': '24', '%': '25', EEX: '26', '4': '4', '5': '5', '6': '6', '*': '20',
  'R/S': '31', SST: '32', RDN: '33', 'X<>Y': '34', CLX: '35', ENTER: '36', '1': '1', '2': '2', '3': '3', '-': '30',
  ON: '41', f: '42', g: '43', STO: '44', RCL: '45', '0': '0', '.': '48', 'S+': '49', '+': '40',
};
// Tokenise "4500 PV 120 CHS PMT g 12x" style strings into keycodes. Numbers expand to digit keys.
export function toCodes(seq) {
  const out = [];
  for (const tok of seq.trim().split(/\s+/)) {
    if (/^\d*\.?\d+$|^\d+\.$/.test(tok) && !(tok in KEY && tok.length === 1 && false)) { for (const ch of tok) out.push(ch === '.' ? '48' : ch); continue; }
    if (!(tok in KEY)) throw new Error('unknown key ' + tok);
    out.push(KEY[tok]);
  }
  return out;
}

// Shifted functions by name -> keycodes (f = 42, g = 43). Used by the guide and tests.
export const FN = {
  AMORT: ['42', '11'], INT: ['42', '12'], NPV: ['42', '13'], RND: ['42', '14'], IRR: ['42', '15'],
  PRICE: ['42', '21'], YTM: ['42', '22'], SL: ['42', '23'], SOYD: ['42', '24'], DB: ['42', '25'],
  'P/R': ['42', '31'], 'CLEAR Σ': ['42', '32'], 'CLEAR PRGM': ['42', '33'], 'CLEAR FIN': ['42', '34'], 'CLEAR REG': ['42', '35'], PREFIX: ['42', '36'],
  '12×': ['43', '11'], '12÷': ['43', '12'], CFo: ['43', '13'], CFj: ['43', '14'], Nj: ['43', '15'], DATE: ['43', '16'],
  BEG: ['43', '7'], END: ['43', '8'], MEM: ['43', '9'], '√x': ['43', '21'], 'eˣ': ['43', '22'], LN: ['43', '23'], FRAC: ['43', '24'], INTG: ['43', '25'],
  'ΔDYS': ['43', '26'], 'D.MY': ['43', '4'], 'M.DY': ['43', '5'], 'x̄w': ['43', '6'], 'x²': ['43', '20'], PSE: ['43', '31'], BST: ['43', '32'],
  GTO: ['43', '33'], 'x≤y': ['43', '34'], 'x=0': ['43', '35'], LSTx: ['43', '36'], 'x̂,r': ['43', '1'], 'ŷ,r': ['43', '2'], 'n!': ['43', '3'],
  'x̄': ['43', '0'], s: ['43', '48'], 'Σ-': ['43', '49'],
};
// Unshifted keys by printed label
export const PLAIN = { n: '11', i: '12', PV: '13', PMT: '14', FV: '15', CHS: '16', '÷': '10', 'yˣ': '21', '1/x': '22', '%T': '23', 'Δ%': '24', '%': '25', EEX: '26',
  '×': '20', 'R/S': '31', SST: '32', 'R↓': '33', 'x≷y': '34', CLx: '35', ENTER: '36', '−': '30', STO: '44', RCL: '45', 'Σ+': '49', '+': '40', '.': '48' };
// Guide token list (labels) -> keycodes. Numbers expand to digits.
export function labelsToCodes(tokens) {
  const out = [];
  for (const t of tokens) {
    if (FN[t]) out.push(...FN[t]);
    else if (PLAIN[t]) out.push(PLAIN[t]);
    else if (/^[0-9.]+$/.test(t)) for (const ch of t) out.push(ch === '.' ? '48' : ch);
    else throw new Error('unknown label ' + t);
  }
  return out;
}
