/**
 * Missing-data simulation: BMI (X) partly missing; SBP (Y) and age (Z) observed.
 * Estimands: the BMI coefficient in SBP ~ BMI + age, and the mean BMI.
 */
import { Rng, logistic, fitOLS, mean, sd, drawNorm, regressionImpute, stochasticRegressionImpute, rubinsRules, tQuantile, summarizeSimulation, type SimSummary } from '@/lib/stats';

export type Mechanism = 'MCAR' | 'MAR-age' | 'MAR-outcome' | 'MNAR';
export type Method = 'full' | 'cca' | 'mean' | 'indicator' | 'regression' | 'stochastic' | 'mi' | 'mi-no-y';

export const methodLabel: Record<Method, string> = {
  full: 'Full data (before deletion)',
  cca: 'Complete cases',
  mean: 'Mean imputation',
  indicator: 'Missing indicator',
  regression: 'Regression imputation',
  stochastic: 'Stochastic regression (single)',
  mi: 'Multiple imputation',
  'mi-no-y': 'MI without the outcome',
};

export const mechanismLabel: Record<Mechanism, string> = {
  MCAR: 'MCAR',
  'MAR-age': 'MAR on age (covariate)',
  'MAR-outcome': 'MAR on SBP (outcome)',
  MNAR: 'MNAR (on BMI itself)',
};

export const TRUTH = { bmiMean: 28, bmiSd: 4.5, betaBmi: 5 / 4.5, betaAge: 4 / 12, sigma: 10 };

export interface SimData {
  age: number[];
  bmi: number[];
  sbp: number[];
  missing: boolean[];
  bmiObs: (number | null)[];
}

export function generate(n: number, mech: Mechanism, propMissing: number, strength: number, rng: Rng): SimData {
  const zs = Array.from({ length: n }, () => rng.normal());
  const xs = zs.map((z) => 0.5 * z + Math.sqrt(0.75) * rng.normal());
  const ys = xs.map((x, i) => 5 * x + 4 * zs[i] + rng.normal(0, TRUTH.sigma));
  const age = zs.map((z) => 60 + 12 * z);
  const bmi = xs.map((x) => TRUTH.bmiMean + TRUTH.bmiSd * x);
  const sbp = ys.map((y) => 130 + y);
  const ysd = sd(ys);
  const driver = mech === 'MCAR' ? zs.map(() => 0) : mech === 'MAR-age' ? zs : mech === 'MAR-outcome' ? ys.map((y) => y / ysd) : xs;
  const g = Math.log(strength); // log-odds ratio per SD of the driver
  // Calibrate the intercept so that the expected missing proportion matches the target.
  let lo = -20, hi = 20;
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    const p = mean(driver.map((d) => logistic(mid + g * d)));
    if (p < propMissing) lo = mid; else hi = mid;
  }
  const a = (lo + hi) / 2;
  const missing = driver.map((d) => rng.uniform() < logistic(a + g * d));
  return { age, bmi, sbp, missing, bmiObs: bmi.map((b, i) => (missing[i] ? null : b)) };
}

export interface Estimate { est: number; se: number; lo: number; hi: number }
export interface MethodResult { beta: Estimate; mean: Estimate; completed?: number[] }

function olsBeta(bmi: number[], age: number[], sbp: number[], extra?: number[]): Estimate {
  const X = bmi.map((b, i) => (extra ? [1, b, age[i], extra[i]] : [1, b, age[i]]));
  const f = fitOLS(X, sbp, extra ? ['i', 'bmi', 'age', 'ind'] : ['i', 'bmi', 'age']);
  return { est: f.coef[1], se: f.se[1], lo: f.ciLow[1], hi: f.ciHigh[1] };
}

function meanEst(x: number[]): Estimate {
  const m = mean(x), se = sd(x) / Math.sqrt(x.length), q = tQuantile(0.975, x.length - 1);
  return { est: m, se, lo: m - q * se, hi: m + q * se };
}

export function analyse(d: SimData, method: Method, rng: Rng, m = 10, delta = 0): MethodResult {
  const { age, sbp, bmiObs } = d;
  const n = age.length;
  if (method === 'full') return { beta: olsBeta(d.bmi, age, sbp), mean: meanEst(d.bmi), completed: d.bmi };
  if (method === 'cca') {
    const idx = bmiObs.map((b, i) => (b === null ? -1 : i)).filter((i) => i >= 0);
    return { beta: olsBeta(idx.map((i) => bmiObs[i] as number), idx.map((i) => age[i]), idx.map((i) => sbp[i])), mean: meanEst(idx.map((i) => bmiObs[i] as number)) };
  }
  const obs = bmiObs.filter((b): b is number => b !== null);
  if (method === 'mean') {
    const filled = bmiObs.map((b) => b ?? mean(obs));
    return { beta: olsBeta(filled, age, sbp), mean: meanEst(filled), completed: filled };
  }
  if (method === 'indicator') {
    const filled = bmiObs.map((b) => b ?? mean(obs));
    const ind = bmiObs.map((b) => (b === null ? 1 : 0));
    return { beta: olsBeta(filled, age, sbp, ind), mean: meanEst(filled), completed: filled };
  }
  const P = Array.from({ length: n }, (_, i) => [1, sbp[i], age[i]]);
  if (method === 'regression') {
    const filled = regressionImpute(bmiObs, P);
    return { beta: olsBeta(filled, age, sbp), mean: meanEst(filled), completed: filled };
  }
  if (method === 'stochastic') {
    const filled = stochasticRegressionImpute(bmiObs, P, rng);
    return { beta: olsBeta(filled, age, sbp), mean: meanEst(filled), completed: filled };
  }
  // Multiple imputation (Bayesian normal model), optionally omitting the outcome, optionally delta-shifted.
  const Pmi = method === 'mi-no-y' ? Array.from({ length: n }, (_, i) => [1, age[i]]) : P;
  const bE: number[] = [], bV: number[] = [], mE: number[] = [], mV: number[] = [];
  let first: number[] | undefined;
  for (let k = 0; k < m; k++) {
    let filled = drawNorm(bmiObs, Pmi, rng);
    if (delta !== 0) filled = filled.map((v, i) => (bmiObs[i] === null ? v + delta : v));
    if (!first) first = filled;
    const b = olsBeta(filled, age, sbp);
    bE.push(b.est); bV.push(b.se ** 2);
    const me = meanEst(filled);
    mE.push(me.est); mV.push(me.se ** 2);
  }
  const pb = rubinsRules(bE, bV, n - 3);
  const pm = rubinsRules(mE, mV, n - 1);
  return {
    beta: { est: pb.estimate, se: pb.se, lo: pb.ciLow, hi: pb.ciHigh },
    mean: { est: pm.estimate, se: pm.se, lo: pm.ciLow, hi: pm.ciHigh },
    completed: first,
  };
}

export const allMethods: Method[] = ['full', 'cca', 'mean', 'indicator', 'regression', 'stochastic', 'mi', 'mi-no-y'];

export interface RepeatResult { method: Method; beta: SimSummary; mean: SimSummary }

export function repeatSim(n: number, mech: Mechanism, prop: number, strength: number, reps: number, seed: string, m = 10): RepeatResult[] {
  const rng = new Rng(seed);
  const acc: Record<Method, { b: number[]; bs: number[]; bl: number[]; bh: number[]; m: number[]; ms: number[]; ml: number[]; mh: number[] }> = Object.fromEntries(
    allMethods.map((k) => [k, { b: [], bs: [], bl: [], bh: [], m: [], ms: [], ml: [], mh: [] }]),
  ) as never;
  for (let r = 0; r < reps; r++) {
    const d = generate(n, mech, prop, strength, rng);
    for (const meth of allMethods) {
      const res = analyse(d, meth, rng, m);
      const a = acc[meth];
      a.b.push(res.beta.est); a.bs.push(res.beta.se); a.bl.push(res.beta.lo); a.bh.push(res.beta.hi);
      a.m.push(res.mean.est); a.ms.push(res.mean.se); a.ml.push(res.mean.lo); a.mh.push(res.mean.hi);
    }
  }
  return allMethods.map((meth) => {
    const a = acc[meth];
    return {
      method: meth,
      beta: summarizeSimulation(a.b, a.bs, a.bl, a.bh, TRUTH.betaBmi),
      mean: summarizeSimulation(a.m, a.ms, a.ml, a.mh, TRUTH.bmiMean),
    };
  });
}
