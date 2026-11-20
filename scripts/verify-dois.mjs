#!/usr/bin/env node
/**
 * Verifies that every DOI in src/content/references.ts resolves at doi.org.
 * Usage: npm run verify:refs
 */
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/content/references.ts', import.meta.url), 'utf8');
const dois = [...src.matchAll(/doi: '([^']+)'/g)].map((m) => m[1]);
let failed = 0;
const results = await Promise.all(
  dois.map(async (doi) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`https://doi.org/api/handles/${encodeURIComponent(doi)}`, { signal: AbortSignal.timeout(15000) });
        const body = await res.json().catch(() => ({}));
        return { doi, ok: res.ok && body.responseCode === 1, status: res.status };
      } catch (e) {
        if (attempt === 2) return { doi, ok: false, status: String(e) };
      }
    }
  }),
);
for (const r of results) {
  if (!r.ok) {
    failed++;
    console.log(`FAIL ${r.doi} (${r.status})`);
  }
}
console.log(`${dois.length - failed}/${dois.length} DOIs resolve.`);
process.exit(failed ? 1 : 0);
