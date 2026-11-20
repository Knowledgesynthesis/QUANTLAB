#!/usr/bin/env node
/**
 * End-to-end smoke test: serves the production build, visits every route at
 * phone and desktop sizes, fails on console errors, page errors, horizontal
 * overflow or empty lessons, and optionally saves screenshots.
 *
 * Usage: npm run build && npm run smoke [-- --shots <dir>] [-- --only <substring>]
 */
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';

function loadPlaywright() {
  const req = createRequire(import.meta.url);
  try { return req('playwright'); } catch { /* global install */ }
  return createRequire(`${execSync('npm root -g').toString().trim()}/`)('playwright');
}
const { chromium } = loadPlaywright();

const args = process.argv.slice(2);
const shotsDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

const registry = readFileSync(new URL('../src/modules/registry.ts', import.meta.url), 'utf8');
const lessons = [...registry.matchAll(/'([a-z-]+\/[a-z-]+)': \(\)/g)].map((m) => `/${m[1]}`);
const moduleRoutes = [...new Set(lessons.map((l) => `/${l.split('/')[1]}`))];
let routes = ['/', '/assessment', '/glossary', '/references', '/about', '/does-not-exist', ...moduleRoutes, ...lessons];
if (only) routes = routes.filter((r) => r.includes(only));

import { createServer } from 'node:net';
const port = await new Promise((resolve) => {
  const srv = createServer();
  srv.listen(0, () => { const p = srv.address().port; srv.close(() => resolve(p)); });
});
const server = spawn(process.execPath, [new URL('../node_modules/vite/bin/vite.js', import.meta.url).pathname, 'preview', '--port', String(port), '--strictPort'], { stdio: 'pipe', env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' } });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview server did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes(String(port))) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => process.stderr.write(d));
});

process.on('exit', () => server.kill());
const browser = await chromium.launch();
const failures = [];
try {
const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1366, height: 900 },
];
for (const vp of viewports) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, colorScheme: vp.name === 'phone' ? 'dark' : 'light' });
  const page = await ctx.newPage();
  let errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  for (const route of routes) {
    errors = [];
    const t0 = Date.now();
    try {
      await page.goto(`http://localhost:${port}${route}`, { waitUntil: 'load', timeout: 20000 });
      await page.waitForFunction(() => !document.body.innerText.includes('Loading'), null, { timeout: 15000 });
    } catch (e) {
      errors.push(`navigation: ${e.message.split('\n')[0]}`);
    }
    await page.waitForTimeout(150);
    const info = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      text: document.querySelector('main')?.innerText.length ?? 0,
      stub: document.body.innerText.includes('Coming in this build'),
      h1: document.querySelector('h1')?.textContent ?? '',
    }));
    const ms = Date.now() - t0;
    const problems = [];
    if (errors.length) problems.push(`console: ${errors.slice(0, 3).join(' | ')}`);
    if (info.overflow > 1) problems.push(`horizontal overflow ${info.overflow}px`);
    if (route === '/does-not-exist') { if (!info.h1.includes('not found')) problems.push('404 page missing'); }
    else if (info.text < 200) problems.push(`little content (${info.text} chars)`);
    if (info.stub) problems.push('stub lesson');
    if (problems.length) failures.push(`${vp.name} ${route}: ${problems.join('; ')}`);
    console.log(`${problems.length ? 'FAIL' : 'ok  '} ${vp.name.padEnd(7)} ${route.padEnd(38)} ${String(ms).padStart(5)}ms  ${info.h1.slice(0, 50)}`);
    if (shotsDir) await page.screenshot({ path: `${shotsDir}/${vp.name}${route.replace(/\//g, '_') || '_home'}.png`, fullPage: true });
  }
  await ctx.close();
}
} finally {
  await browser.close();
  server.kill();
}
if (failures.length) {
  console.log(`\n${failures.length} problem(s):\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`\nAll ${routes.length * 2} page loads passed.`);
