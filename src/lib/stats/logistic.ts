/** Logistic regression (IRLS / Newton–Raphson) and performance measures for risk models. */
import { crossprod, crossprodVec, invertSPD, type Matrix } from './matrix';
import { logistic } from './random';
import { ranks, mean } from './descriptive';
import { zPValue, chiSquarePValue } from './distributions';
import { lowess } from './lowess';

export interface LogisticFit {
  coef: number[];
  se: number[];
  z: number[];
  pValue: number[];
  names: string[];
  linearPredictor: number[];
  fitted: number[];
  deviance: number;
  nullDeviance: number;
  converged: boolean;
  iterations: number;
  /** Fitted probabilities numerically 0 or 1: a sign of (quasi-)complete separation. */
  separation: boolean;
  vcov: Matrix;
  n: number;
}

export interface LogisticOptions {
  offset?: readonly number[];
  maxIter?: number;
  /** Ridge (L2) penalty on non-intercept coefficients; column 0 is assumed to be the intercept. */
  ridge?: number;
  /** Firth's bias-reduced penalized likelihood (Firth 1993) – finite estimates under separation. */
  firth?: boolean;
}

function binomialDeviance(y: readonly number[], p: readonly number[]): number {
  let d = 0;
  for (let i = 0; i < y.length; i++) {
    const pi = Math.min(Math.max(p[i], 1e-15), 1 - 1e-15);
    d += y[i] === 1 ? -2 * Math.log(pi) : -2 * Math.log(1 - pi);
  }
  return d;
}

export function fitLogistic(X: Matrix, y: readonly number[], names: readonly string[], opts: LogisticOptions = {}): LogisticFit {
  const n = X.length, p = X[0].length;
  const offset = opts.offset ?? new Array<number>(n).fill(0);
  const maxIter = opts.maxIter ?? 50;
  const lambda = opts.ridge ?? 0;
  const ybar = mean(y as number[]);
  let beta = new Array<number>(p).fill(0);
  // Start the intercept at the marginal log-odds for faster convergence.
  if (p > 0 && X.every((r) => r[0] === 1)) beta[0] = Math.log(Math.max(ybar, 1e-6) / Math.max(1 - ybar, 1e-6));
  let converged = false;
  let iter = 0;
  let info: Matrix = [];
  let prevDev = Infinity;
  for (iter = 1; iter <= maxIter; iter++) {
    const eta = X.map((r, i) => r.reduce((s, x, j) => s + x * beta[j], 0) + offset[i]);
    const mu = eta.map(logistic);
    const w = mu.map((m) => Math.max(m * (1 - m), 1e-12));
    info = crossprod(X, w);
    if (lambda > 0) for (let j = 1; j < p; j++) info[j][j] += lambda;
    let resid = y.map((yi, i) => yi - mu[i]);
    if (opts.firth) {
      // Firth: modified score U*(β) = Xᵀ(y − μ + h(½ − μ)), h = diag(W^½ X I⁻¹ Xᵀ W^½)
      const Iinv = invertSPD(info);
      const h = X.map((r, i) => {
        let s = 0;
        for (let a = 0; a < p; a++) {
          let t = 0;
          for (let b = 0; b < p; b++) t += Iinv[a][b] * r[b];
          s += r[a] * t;
        }
        return s * w[i];
      });
      resid = resid.map((r, i) => r + h[i] * (0.5 - mu[i]));
    }
    const score = crossprodVec(X, resid);
    if (lambda > 0) for (let j = 1; j < p; j++) score[j] -= lambda * beta[j];
    const Iinv = invertSPD(info);
    const step = Iinv.map((row) => row.reduce((s, v, j) => s + v * score[j], 0));
    // Step halving if the deviance increases (guards against divergence).
    let factor = 1;
    let next = beta.map((b, j) => b + step[j]);
    let dev = binomialDeviance(y, X.map((r, i) => logistic(r.reduce((s, x, j) => s + x * next[j], 0) + offset[i])));
    if (!opts.firth) {
      while (dev > prevDev + 1e-8 && factor > 1e-4) {
        factor /= 2;
        next = beta.map((b, j) => b + factor * step[j]);
        dev = binomialDeviance(y, X.map((r, i) => logistic(r.reduce((s, x, j) => s + x * next[j], 0) + offset[i])));
      }
    }
    const maxChange = Math.max(...next.map((b, j) => Math.abs(b - beta[j])));
    beta = next;
    prevDev = dev;
    if (maxChange < 1e-9) {
      converged = true;
      break;
    }
  }
  const eta = X.map((r, i) => r.reduce((s, x, j) => s + x * beta[j], 0) + offset[i]);
  const fitted = eta.map(logistic);
  const w = fitted.map((m) => Math.max(m * (1 - m), 1e-12));
  info = crossprod(X, w);
  if (lambda > 0) for (let j = 1; j < p; j++) info[j][j] += lambda;
  const vcov = invertSPD(info);
  const se = vcov.map((r, j) => Math.sqrt(r[j]));
  const z = beta.map((b, j) => b / se[j]);
  const separation = fitted.some((f) => f < 1e-8 || f > 1 - 1e-8);
  const nullP = new Array<number>(n).fill(ybar);
  return {
    coef: beta, se, z, pValue: z.map(zPValue), names: [...names], linearPredictor: eta, fitted,
    deviance: binomialDeviance(y, fitted), nullDeviance: binomialDeviance(y, nullP), converged, iterations: iter,
    separation, vcov, n,
  };
}

/** Likelihood-ratio test of the fitted model against the intercept-only model. */
export function lrTest(fit: LogisticFit) {
  const stat = fit.nullDeviance - fit.deviance;
  const df = fit.coef.length - 1;
  return { statistic: stat, df, p: chiSquarePValue(stat, df) };
}

/** Cox–Snell and Nagelkerke R². */
export function pseudoR2(fit: LogisticFit) {
  const lr = fit.nullDeviance - fit.deviance;
  const coxSnell = 1 - Math.exp(-lr / fit.n);
  const maxCS = 1 - Math.exp(-fit.nullDeviance / fit.n);
  return { coxSnell, nagelkerke: coxSnell / maxCS, maxCoxSnell: maxCS };
}

export function predictLogistic(coef: readonly number[], X: Matrix): number[] {
  return X.map((r) => logistic(r.reduce((s, x, j) => s + x * coef[j], 0)));
}

export function linearPredictor(coef: readonly number[], X: Matrix): number[] {
  return X.map((r) => r.reduce((s, x, j) => s + x * coef[j], 0));
}

/** C-statistic (area under the ROC curve) via the Mann–Whitney U statistic; ties count ½. */
export function auc(y: readonly number[], score: readonly number[]): number {
  const r = ranks(score);
  let n1 = 0, sumR = 0;
  for (let i = 0; i < y.length; i++) if (y[i] === 1) { n1++; sumR += r[i]; }
  const n0 = y.length - n1;
  if (n1 === 0 || n0 === 0) return NaN;
  return (sumR - (n1 * (n1 + 1)) / 2) / (n1 * n0);
}

export function brier(y: readonly number[], p: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < y.length; i++) s += (p[i] - y[i]) ** 2;
  return s / y.length;
}

const clampLogit = (p: number) => {
  const q = Math.min(Math.max(p, 1e-12), 1 - 1e-12);
  return Math.log(q / (1 - q));
};

/**
 * Calibration slope (logistic regression of y on the linear predictor) and
 * calibration-in-the-large (intercept with the linear predictor as offset).
 * Ideal values: slope 1, CITL 0 (Van Calster et al. 2019).
 */
export function calibration(y: readonly number[], p: readonly number[]): { slope: number; citl: number; oe: number } {
  const lp = p.map(clampLogit);
  const Xs = lp.map((v) => [1, v]);
  const slopeFit = fitLogistic(Xs, y, ['Intercept', 'lp']);
  const citlFit = fitLogistic(lp.map(() => [1]), y, ['Intercept'], { offset: lp });
  const oe = mean(y as number[]) / mean(p as number[]);
  return { slope: slopeFit.coef[1], citl: citlFit.coef[0], oe };
}

/** Smoothed calibration curve (LOWESS of outcome on predicted risk). */
export function calibrationCurve(y: readonly number[], p: readonly number[], frac = 0.6): { x: number; y: number }[] {
  const sm = lowess(p, y, { frac, iterations: 0 });
  return sm.x.map((x, i) => ({ x, y: Math.min(1, Math.max(0, sm.y[i])) }));
}

/** Grouped calibration: mean predicted vs observed proportion in quantile groups. */
export function calibrationGroups(y: readonly number[], p: readonly number[], groups = 10) {
  const idx = p.map((_, i) => i).sort((a, b) => p[a] - p[b]);
  const out: { predicted: number; observed: number; n: number }[] = [];
  for (let g = 0; g < groups; g++) {
    const lo = Math.floor((g * idx.length) / groups), hi = Math.floor(((g + 1) * idx.length) / groups);
    const sel = idx.slice(lo, hi);
    if (!sel.length) continue;
    out.push({ predicted: mean(sel.map((i) => p[i])), observed: mean(sel.map((i) => y[i])), n: sel.length });
  }
  return out;
}

/**
 * Net benefit at risk threshold pt (Vickers & Elkin 2006):
 * NB = TP/n − FP/n · pt/(1 − pt).
 */
export function netBenefit(y: readonly number[], p: readonly number[], pt: number): number {
  const n = y.length;
  let tp = 0, fp = 0;
  for (let i = 0; i < n; i++) {
    if (p[i] >= pt) {
      if (y[i] === 1) tp++; else fp++;
    }
  }
  return tp / n - (fp / n) * (pt / (1 - pt));
}

export function netBenefitTreatAll(y: readonly number[], pt: number): number {
  const prev = mean(y as number[]);
  return prev - (1 - prev) * (pt / (1 - pt));
}
