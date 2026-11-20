import { describe, expect, it } from 'vitest';
import { Rng } from '@/lib/stats';
import { runPipeline, recommendedChoices, defaultChoices, methodsText, rScript, type PipelineChoices } from '../pipeline/engine';
import { TRUE_LOG_LOS } from '@/data/cohort';

describe('capstone pipeline', () => {
  it('recommended choices recover the true log-LOS coefficients', () => {
    const r = runPipeline(recommendedChoices);
    const get = (t: string) => r.coefs.find((c) => c.term === t)!;
    console.log(r.coefs.map((c) => `${c.term}: ${c.estimate.toFixed(3)} [${c.lo.toFixed(3)}, ${c.hi.toFixed(3)}] truth ${c.truth}`).join('\n'), '\nscore', r.score, 'R2', r.apparentR2.toFixed(3), r.correctedR2.toFixed(3), 'slope', r.calibrationSlope.toFixed(3));
    for (const [t, truth] of [['diabetes', TRUE_LOG_LOS.diabetes], ['creatinine', TRUE_LOG_LOS.logCreatinine], ['hemoglobin', TRUE_LOG_LOS.hemoglobin], ['siteC', TRUE_LOG_LOS.siteC]] as const) {
      const c = get(t);
      expect(c.lo - 0.05).toBeLessThan(truth);
      expect(c.hi + 0.05).toBeGreaterThan(truth);
    }
    expect(r.score).toBeGreaterThanOrEqual(85);
    expect(r.calibrationSlope).toBeGreaterThan(0.85);
  }, 30_000);
  it('naive defaults are flagged by the reviewer', () => {
    const r = runPipeline(defaultChoices);
    console.log('default score', r.score, r.issues.filter((i) => i.severity === 'major').length, 'major issues');
    expect(r.score).toBeLessThan(40);
  });
  it('never crashes across random combinations of choices', () => {
    const rng = new Rng('pipeline-stress');
    for (let k = 0; k < 40; k++) {
      const pick = <T,>(xs: T[]) => xs[rng.int(xs.length)];
      const ch: PipelineChoices = {
        cleaning: {
          dedupe: pick([true, false]), conflicts: pick(['missing', 'first'] as const), convertCreatinine: pick([true, false]), convertHemoglobin: pick([true, false]),
          sentinelsToNA: pick([true, false]), harmoniseSex: pick([true, false]), smokingMissing: pick(['na', 'category', 'never'] as const),
          dateErrors: pick(['na', 'abs', 'keep'] as const), implausibleToNA: pick([true, false]), extremes: pick(['keep', 'delete'] as const),
        },
        model: {
          outcome: pick(['raw', 'log'] as const), age: pick(['linear', 'spline', 'omit'] as const), sex: pick([true, false]), bmi: pick(['continuous', 'obese', 'omit'] as const),
          diabetes: pick([true, false]), hypertension: pick([true, false]), hemoglobin: pick([true, false]), creatinine: pick(['log', 'raw', 'omit'] as const),
          egfr: pick([true, false]), smoking: pick([true, false]), site: pick([true, false]), sbp: pick([true, false]),
        },
        missing: pick(['cca', 'mean', 'mi'] as const),
        robust: pick([true, false]),
      };
      const r = runPipeline(ch, k);
      expect(r.coefs.every((c) => Number.isFinite(c.estimate))).toBe(true);
      expect(Number.isFinite(r.correctedR2)).toBe(true);
      expect(methodsText(ch, r).length).toBeGreaterThan(100);
      expect(rScript(ch, r)).toContain('lm(');
    }
  }, 120_000);
});
