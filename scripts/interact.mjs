#!/usr/bin/env node
/**
 * Interaction stress test: clicks every simulation/run button in every lesson,
 * walks the capstone, drags the influence point by keyboard and takes the mock exam.
 * Fails on any console error or page error. Usage: npm run build && node scripts/interact.mjs
 */
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';

function loadPlaywright() {
  const req = createRequire(import.meta.url);
  try { return req('playwright'); } catch { /* global */ }
  return createRequire(`${execSync('npm root -g').toString().trim()}/`)('playwright');
}
const { chromium } = loadPlaywright();
const port = await new Promise((resolve) => { const s = createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const server = spawn(process.execPath, [new URL('../node_modules/vite/bin/vite.js', import.meta.url).pathname, 'preview', '--port', String(port), '--strictPort'], { stdio: 'pipe', env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' } });
process.on('exit', () => server.kill());
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes(String(port))) { clearTimeout(t); resolve(); } });
});
const base = `http://localhost:${port}`;
const registry = readFileSync(new URL('../src/modules/registry.ts', import.meta.url), 'utf8');
const lessons = [...registry.matchAll(/'([a-z-]+\/[a-z-]+)': \(\)/g)].map((m) => `/${m[1]}`);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
const page = await ctx.newPage();
let errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
const failures = [];
let totalClicks = 0, totalSliders = 0;
const RUN = /^(Run|Simulate|Draw|Repeat|Average|New sample|New dataset|Resimulate|Check$)/;

async function waitIdle() {
  await page.waitForFunction(() => !/Running|Computing|Simulating|Loading lesson/.test(document.body.innerText), null, { timeout: 120000 });
}

for (const route of lessons) {
  errors = [];
  const t0 = Date.now();
  await page.goto(base + route, { waitUntil: 'load' });
  await page.waitForFunction(() => (document.querySelector('main article')?.textContent?.length ?? 0) > 1500, null, { timeout: 30000 });
  await waitIdle();
  const buttons = await page.locator('main button').all();
  let clicked = 0;
  for (const b of buttons) {
    const text = (await b.innerText().catch(() => '')).trim();
    if (!RUN.test(text) || !(await b.isEnabled().catch(() => false))) continue;
    await b.click();
    clicked++;
    await page.waitForTimeout(50);
    await waitIdle();
  }
  // Exercise selects and sliders a little.
  const selects = await page.locator('main select').all();
  for (const s of selects) {
    const opts = await s.locator('option').all();
    if (opts.length > 1) await s.selectOption({ index: opts.length - 1 });
    await waitIdle();
  }
  const ranges = await page.locator('main input[type=range]').all();
  for (const r of ranges.slice(0, 4)) {
    await r.focus();
    for (let k = 0; k < 3; k++) await page.keyboard.press('ArrowRight');
    await waitIdle();
  }
  totalClicks += clicked; totalSliders += Math.min(4, ranges.length);
  const ms = Date.now() - t0;
  const bad = errors.length ? `errors: ${errors.slice(0, 2).join(' | ')}` : '';
  if (bad) failures.push(`${route}: ${bad}`);
  console.log(`${bad ? 'FAIL' : 'ok  '} ${route.padEnd(38)} clicked ${String(clicked).padStart(2)} · ${ranges.length} sliders · ${String(ms).padStart(6)}ms ${bad}`);
}

// Capstone walk-through
errors = [];
await page.goto(`${base}/pipeline/capstone`);
await page.getByRole('button', { name: 'Load recommended choices' }).click();
await page.waitForTimeout(400);
await waitIdle();
for (const step of ['Model', 'Missing data', 'Fit & diagnose', 'Validate', 'Report']) {
  await page.locator('button', { hasText: step }).first().click();
  await waitIdle();
}
const report = await page.locator('main').innerText();
const scoreOk = /Rigor score\s*\n?\s*(\d+)\/100/.exec(report);
console.log(`capstone recommended: score ${scoreOk?.[1]} · errors ${errors.length}`);
if (errors.length || !scoreOk || Number(scoreOk[1]) < 85) failures.push(`capstone: score ${scoreOk?.[1]} errors ${errors.join('|')}`);
await page.getByRole('button', { name: 'Start naive' }).click();
await waitIdle();
await page.waitForTimeout(600);
const naive = /Rigor score\s*\n?\s*(\d+)\/100/.exec(await page.locator('main').innerText());
console.log(`capstone naive: score ${naive?.[1]}`);

// Influence: drag by keyboard
errors = [];
await page.goto(`${base}/diagnostics/influence`);
const handle = page.getByRole('slider', { name: /Movable observation/ });
await handle.focus();
for (let k = 0; k < 10; k++) await page.keyboard.press('ArrowUp');
const after = await handle.getAttribute('aria-valuetext');
console.log(`drag handle after 10× ArrowUp: ${after}`);
if (errors.length) failures.push(`influence drag: ${errors.join('|')}`);

// Mock exam
errors = [];
await page.goto(`${base}/assessment`);
await page.getByRole('tab', { name: 'Mock exam' }).click();
await page.waitForSelector('text=Submit exam');
const qs = await page.locator('main .rounded-xl.border.bg-card').all();
for (const q of qs) { const r = q.locator('input[type=radio]').first(); if (await r.count()) await r.check(); }
await page.getByRole('button', { name: 'Submit exam' }).click();
const examText = await page.locator('main').innerText();
console.log(`exam submitted: ${/(\d+) \/ (\d+)/.exec(examText)?.[0]}`);
if (errors.length) failures.push(`exam: ${errors.join('|')}`);

console.log(`total buttons clicked: ${totalClicks}, sliders moved: ${totalSliders}`);
if (totalClicks < 15) failures.push(`only ${totalClicks} lab buttons were exercised – the test did not run the labs`);
await browser.close();
server.kill();
if (failures.length) { console.log(`\n${failures.length} failure(s)\n${failures.join('\n')}`); process.exit(1); }
console.log('\nAll interactions passed.');
