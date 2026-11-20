// Renders public/favicon.svg to the PNG icons required by the PWA manifest.
// Usage: node scripts/make-icons.mjs   (needs Playwright with Chromium)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

function loadPlaywright() {
  const req = createRequire(import.meta.url);
  try { return req('playwright'); } catch { /* fall back to a global install */ }
  const globalRoot = execSync('npm root -g').toString().trim();
  return createRequire(`${globalRoot}/`)('playwright');
}
const { chromium } = loadPlaywright();

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size] of [['pwa-192x192.png', 192], ['pwa-512x512.png', 512], ['apple-touch-icon.png', 180]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:#1a1a19">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname, omitBackground: false });
}
await browser.close();
console.log('icons written');
