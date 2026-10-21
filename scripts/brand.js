// Propagates APP_NAME from src/config.js into static files (manifest, <title>, faceplate fallback).
// Run after renaming: `npm run brand`
import { readFileSync, writeFileSync } from 'node:fs';
import { APP_NAME } from '../src/config.js';
const m = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
m.name = APP_NAME; m.short_name = APP_NAME; writeFileSync('manifest.webmanifest', JSON.stringify(m, null, 2) + '\n');
let h = readFileSync('index.html', 'utf8');
h = h.replace(/<title>.*?<\/title>/, `<title>${APP_NAME}</title>`).replace(/(apple-mobile-web-app-title" content=")[^"]*/, `$1${APP_NAME}`).replace(/(id="brand" class="brand">)[^<]*/, `$1${APP_NAME}`);
writeFileSync('index.html', h); console.log('branded as', APP_NAME);
