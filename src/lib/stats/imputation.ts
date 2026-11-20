/**
 * Missing-data methods: single imputation (for contrast), Bayesian normal-model
 * and predictive-mean-matching draws for multiple imputation, a compact MICE
 * implementation for continuous variables, and Rubin's rules.
 */
import { Rng } from './random';
import { cholesky, crossprod, crossprodVec, invertSPD, matVec, type Matrix } from './matrix';
import { mean } from './descriptive';
import { tQuantile, tPValue } from './distributions';

export type Maybe = number | null;

export function meanImpute(x: readonly Maybe[]): number[] {
  const obs = x.filter((v): v is number => v !== null);
  const m = mean(obs);
  return x.map((v) => (v === null ? m : v));
}

/** Least-squares coefficients and residual SD for y ~ X (X includes intercept). */
function lsFit(X: Matrix, y: readonly number[]) {
  const xtx = crossprod(X);
  const xtxInv = invertSPD(xtx);
  const beta = matVec(xtxInv, crossprodVec(X, y));
  let rss = 0;
  for (let i = 0; i < X.length; i++) {
    const f = X[i].reduce((s, v, j) => s + v * beta[j], 0);
    rss += (y[i] - f) ** 2;
  }
  return { beta, xtxInv, rss, df: X.length - X[0].length };
}

/** Deterministic regression imputation: plug in the predicted value (no noise). */
export function regressionImpute(target: readonly Maybe[], predictors: Matrix): number[] {
  const obsIdx = target.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0);
  const fit = lsFit(obsIdx.map((i) => predictors[i]), obsIdx.map((i) => target[i] as number));
  return target.map((v, i) => (v === null ? predictors[i].reduce((s, x, j) => s + x * fit.beta[j], 0) : v));
}

/** Stochastic regression imputation: prediction + residual noise, but parameters treated as known. */
export function stochasticRegressionImpute(target: readonly Maybe[], predictors: Matrix, rng: Rng): number[] {
  const obsIdx = target.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0);
  const fit = lsFit(obsIdx.map((i) => predictors[i]), obsIdx.map((i) => target[i] as number));
  const sigma = Math.sqrt(fit.rss / fit.df);
  return target.map((v, i) => (v === null ? predictors[i].reduce((s, x, j) => s + x * fit.beta[j], 0) + rng.normal(0, sigma) : v));
}

/**
 * One proper imputation from the Bayesian linear model (mice's "norm" method):
 * σ*² = RSS/χ²(df), β* ~ N(β̂, σ*²(XᵀX)⁻¹), then y* = Xβ* + ε*, ε* ~ N(0, σ*²).
 */
export function drawNorm(target: readonly Maybe[], predictors: Matrix, rng: Rng): number[] {
  const obsIdx = target.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0);
  const fit = lsFit(obsIdx.map((i) => predictors[i]), obsIdx.map((i) => target[i] as number));
  const sigmaStar = Math.sqrt(fit.rss / rng.chiSquare(fit.df));
  const L = cholesky(fit.xtxInv) ?? fit.xtxInv.map((r, i) => r.map((_, j) => (i === j ? Math.sqrt(fit.xtxInv[i][i]) : 0)));
  const z = fit.beta.map(() => rng.normal());
  const betaStar = fit.beta.map((b, i) => b + sigmaStar * L[i].reduce((s, l, j) => s + l * z[j], 0));
  return target.map((v, i) => (v === null ? predictors[i].reduce((s, x, j) => s + x * betaStar[j], 0) + rng.normal(0, sigmaStar) : v));
}

/**
 * Predictive mean matching (mice's "pmm", type-1 matching, k = 5 donors):
 * imputed values are always observed values, so skewness and bounds are preserved.
 */
export function drawPMM(target: readonly Maybe[], predictors: Matrix, rng: Rng, donors = 5): number[] {
  const obsIdx = target.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0);
  const yObs = obsIdx.map((i) => target[i] as number);
  const fit = lsFit(obsIdx.map((i) => predictors[i]), yObs);
  const sigmaStar = Math.sqrt(fit.rss / rng.chiSquare(fit.df));
  const L = cholesky(fit.xtxInv) ?? fit.xtxInv;
  const z = fit.beta.map(() => rng.normal());
  const betaStar = fit.beta.map((b, i) => b + sigmaStar * L[i].reduce((s, l, j) => s + l * z[j], 0));
  const yhatObs = obsIdx.map((i) => predictors[i].reduce((s, x, j) => s + x * fit.beta[j], 0));
  return target.map((v, i) => {
    if (v !== null) return v;
    const pred = predictors[i].reduce((s, x, j) => s + x * betaStar[j], 0);
    const nearest = yhatObs
      .map((h, k) => [Math.abs(h - pred), k] as const)
      .sort((a, b) => a[0] - b[0])
      .slice(0, donors);
    return yObs[nearest[rng.int(nearest.length)][1]];
  });
}

export interface MiceVariable {
  name: string;
  values: Maybe[];
  method: 'norm' | 'pmm';
}

/**
 * Multivariate imputation by chained equations for continuous variables.
 * `complete` are fully observed covariates (must include the outcome when imputing
 * predictors of an outcome model). Returns m completed copies of each incomplete variable.
 */
export function mice(
  incomplete: MiceVariable[],
  complete: { name: string; values: number[] }[],
  m: number,
  rng: Rng,
  iterations = 10,
): Record<string, number[]>[] {
  const n = (incomplete[0]?.values.length ?? complete[0]?.values.length) || 0;
  const results: Record<string, number[]>[] = [];
  for (let imp = 0; imp < m; imp++) {
    // Initialise by random draws from observed values.
    const current: Record<string, number[]> = {};
    for (const v of incomplete) {
      const obs = v.values.filter((x): x is number => x !== null);
      current[v.name] = v.values.map((x) => (x === null ? obs[rng.int(obs.length)] : x));
    }
    for (let it = 0; it < iterations; it++) {
      for (const v of incomplete) {
        const others = incomplete.filter((o) => o.name !== v.name);
        const X: Matrix = Array.from({ length: n }, (_, i) => [
          1,
          ...complete.map((c) => c.values[i]),
          ...others.map((o) => current[o.name][i]),
        ]);
        current[v.name] = v.method === 'pmm' ? drawPMM(v.values, X, rng) : drawNorm(v.values, X, rng);
      }
    }
    results.push(current);
  }
  return results;
}

export interface PooledEstimate {
  estimate: number;
  withinVar: number;
  betweenVar: number;
  totalVar: number;
  se: number;
  df: number;
  /** Relative increase in variance due to nonresponse. */
  riv: number;
  /** Fraction of missing information. */
  fmi: number;
  ciLow: number;
  ciHigh: number;
  p: number;
  m: number;
}

/**
 * Rubin's rules (Rubin 1987) with the Barnard–Rubin (1999) small-sample
 * degrees of freedom when the complete-data df is supplied (as mice::pool).
 */
export function rubinsRules(estimates: readonly number[], variances: readonly number[], dfComplete = Infinity, level = 0.95): PooledEstimate {
  const m = estimates.length;
  const qbar = mean(estimates);
  const ubar = mean(variances);
  const b = m > 1 ? estimates.reduce((s, q) => s + (q - qbar) ** 2, 0) / (m - 1) : 0;
  const t = ubar + (1 + 1 / m) * b;
  const riv = ubar > 0 ? ((1 + 1 / m) * b) / ubar : 0;
  const lambda = t > 0 ? ((1 + 1 / m) * b) / t : 0;
  let df: number;
  if (b === 0) {
    df = dfComplete;
  } else {
    const dfOld = (m - 1) / (lambda * lambda);
    if (Number.isFinite(dfComplete)) {
      const dfObs = ((dfComplete + 1) / (dfComplete + 3)) * dfComplete * (1 - lambda);
      df = (dfOld * dfObs) / (dfOld + dfObs);
    } else {
      df = dfOld;
    }
  }
  const fmi = (riv + 2 / (df + 3)) / (riv + 1);
  const se = Math.sqrt(t);
  const q = tQuantile(1 - (1 - level) / 2, df);
  return {
    estimate: qbar, withinVar: ubar, betweenVar: b, totalVar: t, se, df, riv, fmi,
    ciLow: qbar - q * se, ciHigh: qbar + q * se, p: tPValue(qbar / se, df), m,
  };
}
