import { describe, expect, it } from 'vitest';
import { repeatSim, TRUTH } from '../missing-data/sim';

const get = (r: ReturnType<typeof repeatSim>, m: string) => r.find((x) => x.method === m)!;

describe('missing-data simulator reproduces established results', () => {
  it('MAR on a covariate: complete cases unbiased for β, biased for the mean', () => {
    const r = repeatSim(400, 'MAR-age', 0.4, 4, 120, 'test-mar-age', 5);
    const cca = get(r, 'cca');
    console.log('MAR-age', r.map((x) => `${x.method}: βbias ${x.beta.bias.toFixed(3)} cov ${x.beta.coverage.toFixed(2)} | mean bias ${x.mean.bias.toFixed(2)}`).join('\n'));
    expect(Math.abs(cca.beta.bias)).toBeLessThan(3 * cca.beta.biasMCSE + 0.01);
    expect(Math.abs(cca.mean.bias)).toBeGreaterThan(0.5);
    expect(Math.abs(get(r, 'mi').mean.bias)).toBeLessThan(0.25);
  });
  it('MAR on the outcome: CCA biased for β; MI with outcome unbiased; MI without outcome attenuated', () => {
    const r = repeatSim(400, 'MAR-outcome', 0.4, 4, 120, 'test-mar-y', 5);
    console.log('MAR-y', r.map((x) => `${x.method}: βbias ${x.beta.bias.toFixed(3)} cov ${x.beta.coverage.toFixed(2)} | mean bias ${x.mean.bias.toFixed(2)}`).join('\n'));
    expect(Math.abs(get(r, 'cca').beta.bias)).toBeGreaterThan(0.08);
    expect(Math.abs(get(r, 'mi').beta.bias)).toBeLessThan(0.05);
    expect(get(r, 'mi').beta.coverage).toBeGreaterThan(0.88);
    expect(get(r, 'mi-no-y').beta.bias).toBeLessThan(-0.1);
    expect(get(r, 'mean').beta.coverage).toBeLessThan(0.85);
    expect(TRUTH.betaBmi).toBeCloseTo(1.111, 3);
  });
  it('MNAR: every method is biased for the mean BMI', () => {
    const r = repeatSim(400, 'MNAR', 0.4, 4, 80, 'test-mnar', 5);
    console.log('MNAR', r.map((x) => `${x.method}: mean bias ${x.mean.bias.toFixed(2)}`).join('\n'));
    for (const m of ['cca', 'mean', 'mi', 'regression']) expect(get(r, m).mean.bias).toBeLessThan(-0.5);
  });
});
