// Faceplate layout: 4 rows x 10 columns, same positions as the classic 12C.
// [code, main label, f legend (above), g legend (below), extra class]
export const ROWS = [
  [['11', 'n', 'AMORT', '12×'], ['12', 'i', 'INT', '12÷'], ['13', 'PV', 'NPV', 'CFo'], ['14', 'PMT', 'RND', 'CFj'], ['15', 'FV', 'IRR', 'Nj'],
   ['16', 'CHS', '', 'DATE'], ['7', '7', '', 'BEG', 'num'], ['8', '8', '', 'END', 'num'], ['9', '9', '', 'MEM', 'num'], ['10', '÷', '', '', 'op']],
  [['21', 'yˣ', 'PRICE', '√x'], ['22', '1/x', 'YTM', 'eˣ'], ['23', '%T', 'SL', 'LN'], ['24', 'Δ%', 'SOYD', 'FRAC'], ['25', '%', 'DB', 'INTG'],
   ['26', 'EEX', '', 'ΔDYS'], ['4', '4', '', 'D.MY', 'num'], ['5', '5', '', 'M.DY', 'num'], ['6', '6', '', 'x̄w', 'num'], ['20', '×', '', 'x²', 'op']],
  [['31', 'R/S', 'P/R', 'PSE'], ['32', 'SST', 'Σ', 'BST'], ['33', 'R↓', 'PRGM', 'GTO'], ['34', 'x≷y', 'FIN', 'x≤y'], ['35', 'CLx', 'REG', 'x=0'],
   ['36', 'ENTER', 'PREFIX', 'LSTx', 'enter'], ['1', '1', '', 'x̂,r', 'num'], ['2', '2', '', 'ŷ,r', 'num'], ['3', '3', '', 'n!', 'num'], ['30', '−', '', '', 'op']],
  [['41', '≡', '', '', 'on'], ['42', 'f', '', '', 'fkey'], ['43', 'g', '', '', 'gkey'], ['44', 'STO', '', ''], ['45', 'RCL', '', ''],
   null, ['0', '0', '', 'x̄', 'num'], ['48', '·', '', 's', 'num'], ['49', 'Σ+', '', 'Σ-'], ['40', '+', '', '', 'op']],
];
// Brackets drawn above f legends: [row, firstCol, lastCol, label]
export const BRACKETS = [[1, 0, 1, 'BOND'], [1, 2, 4, 'DEPRECIATION'], [2, 1, 4, 'CLEAR']];
