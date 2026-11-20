import { describe, expect, it } from 'vitest';
import { cohort, ckdEpi2021, generateCohort } from '../cohort';
import { messyExtract, PLAUSIBLE } from '../messy';
import { mean, median, correlation } from '@/lib/stats';

describe('synthetic cohort', () => {
  const c = cohort();
  it('is reproducible from its seed', () => {
    expect(generateCohort(560, 2025)).toEqual(c);
    expect(generateCohort(560, 2026)).not.toEqual(c);
  });
  it('has clinically plausible marginal distributions', () => {
    const stats = {
      n: c.length,
      age: mean(c.map((r) => r.age)),
      diabetes: mean(c.map((r) => r.diabetes)),
      htn: mean(c.map((r) => r.hypertension)),
      readmit: mean(c.map((r) => r.readmit_30d)),
      losMedian: median(c.map((r) => r.los_days)),
      egfrMedian: median(c.map((r) => r.egfr)),
      bmiMedian: median(c.map((r) => r.bmi)),
      rCrEgfr: correlation(c.map((r) => Math.log(r.creatinine)), c.map((r) => Math.log(r.egfr))),
      rSbpDbp: correlation(c.map((r) => r.sbp), c.map((r) => r.dbp)),
    };
    console.log(stats);
    expect(stats.n).toBeGreaterThan(580);
    expect(stats.diabetes).toBeGreaterThan(0.15);
    expect(stats.diabetes).toBeLessThan(0.4);
    expect(stats.readmit).toBeGreaterThan(0.1);
    expect(stats.readmit).toBeLessThan(0.3);
    expect(stats.losMedian).toBeGreaterThan(2.5);
    expect(stats.losMedian).toBeLessThan(6);
    expect(stats.egfrMedian).toBeGreaterThan(55);
    expect(stats.egfrMedian).toBeLessThan(100);
    expect(stats.rCrEgfr).toBeLessThan(-0.85);
    expect(stats.rSbpDbp).toBeGreaterThan(0.4);
  });
  it('CKD-EPI 2021 reproduces published reference values', () => {
    // 50-year-old: female Scr 0.7 → ~ 103; male Scr 0.9 → ~ 102 (κ thresholds)
    expect(ckdEpi2021(0.7, 50, 'F')).toBeCloseTo(142 * 0.9938 ** 50 * 1.012, 6);
    expect(ckdEpi2021(0.9, 50, 'M')).toBeCloseTo(142 * 0.9938 ** 50, 6);
    expect(ckdEpi2021(2.0, 70, 'M')).toBeCloseTo(142 * (2 / 0.9) ** -1.2 * 0.9938 ** 70, 6);
  });
});

describe('messy extract answer key is consistent with what the audit computes', () => {
  const { rows, issues } = messyExtract();
  const byId = Object.fromEntries(issues.map((i) => [i.id, i]));
  it('exact duplicates are detectable', () => {
    const seen = new Map<string, number>();
    let dups = 0;
    for (const r of rows) {
      const { row: _row, ...rest } = r;
      const key = JSON.stringify(rest);
      if (seen.has(key)) dups++;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    expect(dups).toBe(6);
    expect(byId['exact-duplicates'].rows).toHaveLength(12);
  });
  it('conflicting duplicates share an id but differ', () => {
    const ids = new Map<string, Set<string>>();
    for (const r of rows) {
      const { row: _row, ...rest } = r;
      if (!ids.has(r.admission_id)) ids.set(r.admission_id, new Set());
      ids.get(r.admission_id)!.add(JSON.stringify(rest));
    }
    const conflicting = [...ids.values()].filter((s) => s.size > 1).length;
    expect(conflicting).toBe(2);
  });
  it('sentinels and range violations are present as documented', () => {
    expect(rows.filter((r) => r.heart_rate === 999).length).toBeGreaterThanOrEqual(5);
    expect(rows.filter((r) => r.age === 999).length).toBeGreaterThanOrEqual(2);
    const hbBad = rows.filter((r) => r.hemoglobin !== null && r.hemoglobin > PLAUSIBLE.hemoglobin[1]);
    expect(hbBad.length).toBeGreaterThanOrEqual(3);
    expect(rows.filter((r) => (r.los_days ?? 0) < 0).length).toBe(3);
    expect(new Set(rows.map((r) => r.sex)).size).toBeGreaterThan(4);
  });
  it('site B creatinine is on a different scale while eGFR is not', () => {
    const med = (s: string, k: 'creatinine' | 'egfr') => median(rows.filter((r) => r.site === s && r[k] !== null).map((r) => r[k] as number));
    expect(med('B', 'creatinine') / med('A', 'creatinine')).toBeGreaterThan(60);
    expect(Math.abs(med('B', 'egfr') - med('A', 'egfr'))).toBeLessThan(15);
  });
  it('every issue has exactly one correct option', () => {
    for (const i of issues) expect(i.options.filter((o) => o.correct)).toHaveLength(1);
  });
});
