// Back-of-calculator quick reference. Each step lists key labels (see keymap.js FN/PLAIN);
// `shows` is the expected display after the step and is verified by tests/guide.test.js.
export const GUIDE = [
  { tag: 'BOND', items: [
    { problem: ['Yield 5.5%, coupon 4.25%', 'Settle 3/15/2025', 'Matures 11/15/2034', 'Price? Price + accrued?'], steps: [
      { keys: ['M.DY', '5.5', 'i', '4.25', 'PMT'] },
      { keys: ['3.152025', 'ENTER', '11.152034'] },
      { keys: ['PRICE'], note: 'price per 100', shows: '90.72' },
      { keys: ['+'], note: 'price + accrued', shows: '92.13' }] },
    { problem: ['Same bond quoted at 96.50', 'Yield to maturity?'], steps: [
      { keys: ['M.DY', '96.5', 'PV', '4.25', 'PMT'] },
      { keys: ['3.152025', 'ENTER', '11.152034'] },
      { keys: ['YTM'], note: 'YTM %', shows: '4.70' }] },
  ] },
  { tag: 'DEPR', items: [
    { problem: ['Cost 25,000  Salvage 2,500', 'Life 7 yrs  DB factor 150%', 'Year 1 depreciation'], steps: [
      { keys: ['25000', 'PV', '2500', 'FV', '7', 'n', '150', 'i'] },
      { keys: ['1', 'SL'], note: 'straight line', shows: '3,214.29' },
      { keys: ['1', 'SOYD'], note: 'sum of yrs digits', shows: '5,625.00' },
      { keys: ['1', 'DB'], note: 'declining balance', shows: '5,357.14' },
      { keys: ['x≷y'], note: 'remaining depreciable', shows: '17,142.86' }] },
  ] },
  { tag: 'DATE', items: [
    { problem: ['7/4/2025 + 90 days = ?'], steps: [
      { keys: ['M.DY', '7.042025', 'ENTER', '90'] },
      { keys: ['DATE'], note: 'date, weekday (1=Mon)', shows: '10,02,2025  4' }] },
    { problem: ['Days 1/15/2025 → 9/30/2026'], steps: [
      { keys: ['M.DY', '1.152025', 'ENTER', '9.302026'] },
      { keys: ['ΔDYS'], note: 'actual days', shows: '623.00' },
      { keys: ['x≷y'], note: '30/360 days', shows: '615.00' }] },
  ] },
  { tag: 'INT', items: [
    { problem: ['90 days, 6.25% simple', 'Principal 12,000'], steps: [
      { keys: ['90', 'n', '6.25', 'i', '12000', 'CHS', 'PV'] },
      { keys: ['INT'], note: 'interest, 360-day', shows: '187.50' },
      { keys: ['+'], note: 'principal + interest', shows: '12,187.50' },
      { keys: ['INT', 'R↓', 'x≷y'], note: 'interest, 365-day', shows: '184.93' }] },
  ] },
  { tag: 'AMORT', items: [
    { problem: ['30 yrs, 6.75%, loan 400,000', 'First year split'], steps: [
      { keys: ['CLEAR FIN', '30', '12×', '6.75', '12÷', '400000', 'PV', 'PMT'], note: 'monthly payment', shows: '-2,594.39' },
      { keys: ['0', 'n', '12', 'AMORT'], note: 'interest, yr 1', shows: '-26,869.71' },
      { keys: ['x≷y'], note: 'principal, yr 1', shows: '-4,263.00' },
      { keys: ['RCL', 'PV'], note: 'balance', shows: '395,737.00' }] },
  ] },
  { tag: 'LOAN', items: [
    { problem: ['Mortgage 320,000', '7% for 30 yrs, monthly'], steps: [
      { keys: ['CLEAR FIN', '30', '12×', '7', '12÷', '320000', 'PV', 'PMT'], note: 'payment', shows: '-2,128.97' }] },
    { problem: ['Max loan for 2,500/mo', 'at 6.5%, 30 yrs'], steps: [
      { keys: ['CLEAR FIN', '30', '12×', '6.5', '12÷', '2500', 'CHS', 'PMT', 'PV'], note: 'max loan', shows: '395,527.05' }] },
  ] },
  { tag: 'DCF', items: [
    { problem: ['Buy 850,000; NOI 62,000', 'yrs 1-4; yr 5 NOI 64,000', '+ resale 1,000,000', 'NPV @ 8%? IRR?'], steps: [
      { keys: ['CLEAR REG', '850000', 'CHS', 'CFo'] },
      { keys: ['62000', 'CFj', '4', 'Nj'] },
      { keys: ['1064000', 'CFj'] },
      { keys: ['8', 'i', 'NPV'], note: 'NPV', shows: '79,492.39' },
      { keys: ['IRR'], note: 'IRR %', shows: '10.21' }] },
  ] },
  { tag: 'RATE', items: [
    { problem: ['Cap rate: NOI 62,000', 'price 850,000'], steps: [
      { keys: ['850000', 'ENTER', '62000', '%T'], note: 'cap rate %', shows: '7.29' }] },
    { problem: ['Value: NOI 62,000 at 7.25% cap'], steps: [
      { keys: ['62000', 'ENTER', '7.25', '÷', '100', '×'], note: 'value', shows: '855,172.41' }] },
    { problem: ['Comp sold 410,000,', 'resold 452,000: % change'], steps: [
      { keys: ['410000', 'ENTER', '452000', 'Δ%'], note: '% change', shows: '10.24' }] },
    { problem: ['Time adjust +0.4%/mo', 'for 9 months on 410,000'], steps: [
      { keys: ['410000', 'ENTER', '1.004', 'ENTER', '9', 'yˣ', '×'], note: 'adjusted price', shows: '424,998.38' }] },
  ] },
];
// Statistics register map shown on the back panel
export const SIGMA_MAP = [['n', 'R1'], ['Σx', 'R2'], ['Σx²', 'R3'], ['Σy', 'R4'], ['Σy²', 'R5'], ['Σxy', 'R6']];
