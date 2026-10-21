import test from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { APP_NAME } from '../src/config.js';
const files = ['index.html', 'manifest.webmanifest', 'sw.js', ...readdirSync('src').map((f) => 'src/' + f)];
test('branding matches config (title, manifest, faceplate, home-screen title)', () => {
  const m = JSON.parse(readFileSync('manifest.webmanifest', 'utf8')); const h = readFileSync('index.html', 'utf8');
  assert.equal(m.name, APP_NAME); assert.equal(m.short_name, APP_NAME);
  assert.match(h, new RegExp(`<title>${APP_NAME}</title>`)); assert.match(h, new RegExp(`apple-mobile-web-app-title" content="${APP_NAME}"`));
  assert.match(h, new RegExp(`class="brand">${APP_NAME}<`));
});
test('iOS web-app meta, 180px touch icon, no-zoom viewport', () => {
  const h = readFileSync('index.html', 'utf8');
  assert.match(h, /apple-mobile-web-app-capable" content="yes"/); assert.match(h, /user-scalable=no/); assert.match(h, /viewport-fit=cover/);
  assert.match(h, /apple-touch-icon" sizes="180x180" href="\.\/icons\/icon-180\.png"/); assert.ok(existsSync('icons/icon-180.png'));
});
test('no external URLs / CDNs, only relative paths, no third-party marks', () => {
  for (const f of files) {
    const t = readFileSync(f, 'utf8');
    assert.doesNotMatch(t, /https?:\/\//, f); assert.doesNotMatch(t, /(src|href)=["']\//, f);
    assert.doesNotMatch(t, /hewlett|packard|\bHP\b/i, f);
  }
});
test('service worker precaches every module', () => {
  const sw = readFileSync('sw.js', 'utf8'); for (const f of readdirSync('src')) assert.ok(sw.includes('./src/' + f), f);
});
test('engine is pure (no DOM / browser globals)', () => {
  for (const f of ['src/engine.js', 'src/keymap.js', 'src/layout.js', 'src/guide.js'])
    assert.doesNotMatch(readFileSync(f, 'utf8').replace(/\/\/.*$/gm, ''), /\b(document|window|localStorage|navigator)\b/, f);
});
