import { describe, expect, it } from 'vitest';
import { Rng, mean } from '@/lib/stats';
import { generate, fit, evaluate, bootstrapOptimism, crossValidatedAUC, splitSample } from '../validation/sim';

describe('validation simulation behaves as the literature predicts', () => {
  it('apparent AUC is optimistic with many noise predictors; bootstrap correction removes most of it', () => {
    const rng = new Rng('vt');
    const test = generate(4000, 15, rng);
    const errApp: number[] = [], errBoot: number[] = [], errCV: number[] = [], errSplit: number[] = [], prev: number[] = [];
    for (let r = 0; r < 12; r++) {
      const d = generate(200, 15, rng);
      prev.push(mean(d.y));
      const truth = evaluate(fit(d), test).auc;
      const bo = bootstrapOptimism(d, 40, rng);
      errApp.push(bo.apparent - truth);
      errBoot.push(bo.corrected - truth);
      errCV.push(crossValidatedAUC(d, 10, rng) - truth);
      errSplit.push(splitSample(d, rng) - truth);
    }
    console.log({ prev: mean(prev), app: mean(errApp), boot: mean(errBoot), cv: mean(errCV), split: mean(errSplit) });
    expect(mean(prev)).toBeGreaterThan(0.15);
    expect(mean(prev)).toBeLessThan(0.3);
    expect(mean(errApp)).toBeGreaterThan(0.04);
    expect(Math.abs(mean(errBoot))).toBeLessThan(mean(errApp) / 2);
    expect(Math.abs(mean(errCV))).toBeLessThan(mean(errApp) / 2);
  });
});
