/** Simulation engine for prediction-model validation lessons (binary outcome). */
import { Rng, fitLogistic, linearPredictor, auc, calibration, brier, foldAssignments, logistic, mean } from '@/lib/stats';

export const TRUE_BETAS = [0.8, 0.6, 0.45, 0.3];

export interface Dataset { X: number[][]; y: number[] }

/** Intercept giving ~20% prevalence for the true predictors. */
export const BASE_INTERCEPT = -1.75;

export function generate(n: number, noise: number, rng: Rng, interceptShift = 0): Dataset {
  const p = TRUE_BETAS.length + noise;
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = Array.from({ length: p }, () => rng.normal());
    const lp = BASE_INTERCEPT + interceptShift + TRUE_BETAS.reduce((s, b, j) => s + b * x[j], 0);
    X.push([1, ...x]);
    y.push(rng.bernoulli(logistic(lp)));
  }
  return { X, y };
}

export function names(p: number) {
  return ['(Intercept)', ...Array.from({ length: p }, (_, j) => (j < TRUE_BETAS.length ? `x${j + 1}` : `noise${j - TRUE_BETAS.length + 1}`))];
}

export interface Perf { auc: number; slope: number; citl: number; brier: number }

export function evaluate(coef: number[], d: Dataset): Perf {
  const lp = linearPredictor(coef, d.X);
  const p = lp.map(logistic);
  const cal = calibration(d.y, p);
  return { auc: auc(d.y, p), slope: cal.slope, citl: cal.citl, brier: brier(d.y, p) };
}

export function fit(d: Dataset) {
  return fitLogistic(d.X, d.y, names(d.X[0].length - 1), { maxIter: 25 }).coef;
}

const subset = (d: Dataset, idx: number[]): Dataset => ({ X: idx.map((i) => d.X[i]), y: idx.map((i) => d.y[i]) });

export function splitSample(d: Dataset, rng: Rng, frac = 0.7): number {
  const idx = rng.shuffle(d.y.map((_, i) => i));
  const k = Math.round(frac * idx.length);
  const train = subset(d, idx.slice(0, k));
  const test = subset(d, idx.slice(k));
  return evaluate(fit(train), test).auc;
}

export function crossValidatedAUC(d: Dataset, k: number, rng: Rng): number {
  const folds = foldAssignments(d.y.length, k, rng, d.y);
  const aucs: number[] = [];
  for (let f = 0; f < k; f++) {
    const tr = d.y.map((_, i) => i).filter((i) => folds[i] !== f);
    const te = d.y.map((_, i) => i).filter((i) => folds[i] === f);
    aucs.push(evaluate(fit(subset(d, tr)), subset(d, te)).auc);
  }
  return mean(aucs.filter(Number.isFinite));
}

/** Harrell's bootstrap optimism correction for the C-statistic and calibration slope. */
export function bootstrapOptimism(d: Dataset, B: number, rng: Rng) {
  const full = fit(d);
  const app = evaluate(full, d);
  let optAuc = 0, optSlope = 0, used = 0;
  for (let b = 0; b < B; b++) {
    const idx = rng.resampleIndices(d.y.length);
    const bs = subset(d, idx);
    if (bs.y.every((v) => v === bs.y[0])) continue;
    const cb = fit(bs);
    const onBoot = evaluate(cb, bs);
    const onOrig = evaluate(cb, d);
    optAuc += onBoot.auc - onOrig.auc;
    optSlope += onBoot.slope - onOrig.slope;
    used++;
  }
  return { apparent: app.auc, corrected: app.auc - optAuc / used, slope: 1 - optSlope / used };
}
