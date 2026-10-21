# RPN12C
Offline RPN financial calculator (PWA, Capacitor-ready) that copies the classic 12C keyboard and behaviour. It has no dependencies, uses no CDNs, and uses only relative paths.

- `src/config.js`: APP_NAME, the only place the name is set. After renaming, run `npm run brand` to update the manifest, `<title>`, the iOS home-screen title and the faceplate label.
- `src/engine.js`: pure keystroke-level engine. It handles stack and lift rules, 10-digit rounding, TVM with odd periods, AMORT, INT, NPV/IRR, bonds, depreciation, dates, statistics, programming (99 lines) and error numbers.
- `src/keymap.js`: keycodes and label-to-key maps. `src/layout.js`: the 4x10 faceplate. `src/guide.js`: data for the back-panel reference.
- `src/ui.js` and `src/style.css`: rendering, scaling and rotation, flip animation, and localStorage persistence. `sw.js`: offline cache.
- `npm test`: runs handbook-example, numeric, program, guide-verification and static checks.
Capacitor: point `webDir` at this folder.
