/**
 * Ordinary least squares with the full set of standard regression diagnostics.
 * Definitions follow Belsley, Kuh & Welsch (1980), Cook (1977) and R's stats::influence.measures.
 */
import { crossprod, crossprodVec, invertSPD, matVec, type Matrix } from './matrix';
import { mean, median } from './descriptive';
import { fPValue, tPValue, tQuantile, chiSquarePValue } from './distributions';

export interface OLSFit {
  n: number;
  /** Number of estimated coefficients (rank). */
  p: number;
  names: string[];
  /** Columns dropped because they were exact linear combinations of others (like R's NA coefficients). */
  aliased: string[];
  keptColumns: number[];
  coef: number[];
  se: number[];
  t: number[];
  pValue: number[];
  ciLow: number[];
  ciHigh: number[];
  dfResid: number;
  sigma: number;
  rss: number;
  tss: number;
  r2: number;
  adjR2: number;
  fStat: number;
  fP: number;
  fitted: number[];
  residuals: number[];
  /** Leverage (diagonal of the hat matrix). */
  hat: number[];
  /** Internally studentized residuals (R: rstandard). */
  stdResid: number[];
  /** Externally studentized residuals (R: rstudent). */
  studResid: number[];
  cooks: number[];
  /** n × p matrix of DFBETAS. */
  dfbetas: number[][];
  dffits: number[];
  xtxInv: Matrix;
  vcov: Matrix;
  hasIntercept: boolean;
  X: Matrix;
  y: number[];
}

export interface OLSOptions {
  /** Confidence level for coefficient intervals (default 0.95). */
  level?: number;
}

/** Detect exactly collinear columns via modified Gram–Schmidt (tolerance 1e-7, as R's lm). */
export function independentColumns(X: Matrix, tol = 1e-7): number[] {
  const n = X.length, p = X[0].length;
  const basis: number[][] = [];
  const keep: number[] = [];
  for (let j = 0; j < p; j++) {
    const v = X.map((r) => r[j]);
    const norm0 = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    if (norm0 === 0) continue;
    for (const q of basis) {
      let dot = 0;
      for (let i = 0; i < n; i++) dot += q[i] * v[i];
      for (let i = 0; i < n; i++) v[i] -= dot * q[i];
    }
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    if (norm > tol * norm0) {
      basis.push(v.map((x) => x / norm));
      keep.push(j);
    }
  }
  return keep;
}

export function fitOLS(Xfull: Matrix, y: readonly number[], namesFull: readonly string[], opts: OLSOptions = {}): OLSFit {
  const n = Xfull.length;
  const level = opts.level ?? 0.95;
  const keptColumns = independentColumns(Xfull);
  const X = keptColumns.length === Xfull[0].length ? Xfull : Xfull.map((r) => keptColumns.map((j) => r[j]));
  const names = keptColumns.map((j) => namesFull[j]);
  const aliased = namesFull.filter((_, j) => !keptColumns.includes(j));
  const p = keptColumns.length;
  const yy = [...y];

  const xtx = crossprod(X);
  const xtxInv = invertSPD(xtx);
  const coef = matVec(xtxInv, crossprodVec(X, yy));
  const fitted = X.map((r) => r.reduce((s, x, j) => s + x * coef[j], 0));
  const residuals = yy.map((v, i) => v - fitted[i]);
  const rss = residuals.reduce((s, e) => s + e * e, 0);
  const hasIntercept = X.some(() => true) && keptColumns.some((j) => Xfull.every((r) => r[j] === 1));
  const ybar = mean(yy);
  const tss = hasIntercept ? yy.reduce((s, v) => s + (v - ybar) ** 2, 0) : yy.reduce((s, v) => s + v * v, 0);
  const dfResid = n - p;
  const sigma2 = rss / dfResid;
  const sigma = Math.sqrt(sigma2);
  const vcov = xtxInv.map((r) => r.map((v) => v * sigma2));
  const se = vcov.map((r, j) => Math.sqrt(r[j]));
  const t = coef.map((b, j) => b / se[j]);
  const pValue = t.map((tv) => tPValue(tv, dfResid));
  const tq = tQuantile(1 - (1 - level) / 2, dfResid);
  const ciLow = coef.map((b, j) => b - tq * se[j]);
  const ciHigh = coef.map((b, j) => b + tq * se[j]);
  const r2 = 1 - rss / tss;
  const dfModel = hasIntercept ? p - 1 : p;
  const adjR2 = hasIntercept ? 1 - ((1 - r2) * (n - 1)) / dfResid : 1 - ((1 - r2) * n) / dfResid;
  const fStat = dfModel > 0 ? ((tss - rss) / dfModel) / sigma2 : NaN;
  const fP = dfModel > 0 ? fPValue(fStat, dfModel, dfResid) : NaN;

  // Hat values and influence
  const hat = new Array<number>(n);
  const dfbetas: number[][] = new Array(n);
  const stdResid = new Array<number>(n);
  const studResid = new Array<number>(n);
  const cooks = new Array<number>(n);
  const dffits = new Array<number>(n);
  const diagInvSqrt = xtxInv.map((r, j) => Math.sqrt(r[j]));
  for (let i = 0; i < n; i++) {
    const xi = X[i];
    const ax = matVec(xtxInv, xi); // (XᵀX)⁻¹ xᵢ
    const h = xi.reduce((s, v, j) => s + v * ax[j], 0);
    hat[i] = h;
    const e = residuals[i];
    const oneMinus = 1 - h;
    const r = e / (sigma * Math.sqrt(oneMinus));
    stdResid[i] = r;
    // Leave-one-out residual variance
    const s2i = (dfResid * sigma2 - (e * e) / oneMinus) / (dfResid - 1);
    const si = Math.sqrt(Math.max(s2i, 0));
    studResid[i] = e / (si * Math.sqrt(oneMinus));
    cooks[i] = (r * r * h) / (p * oneMinus);
    dffits[i] = studResid[i] * Math.sqrt(h / oneMinus);
    dfbetas[i] = ax.map((v, j) => (v * e) / oneMinus / (si * diagInvSqrt[j]));
  }

  return {
    n, p, names, aliased, keptColumns, coef, se, t, pValue, ciLow, ciHigh, dfResid, sigma, rss, tss, r2, adjR2,
    fStat, fP, fitted, residuals, hat, stdResid, studResid, cooks, dfbetas, dffits, xtxInv, vcov, hasIntercept,
    X, y: yy,
  };
}

export type HCType = 'HC0' | 'HC1' | 'HC3';

/** Heteroscedasticity-consistent (sandwich) covariance. HC3 is recommended for n < 250 (Long & Ervin 2000). */
export function robustVcov(fit: OLSFit, type: HCType = 'HC3'): Matrix {
  const { X, residuals, hat, xtxInv, n, p } = fit;
  const w = residuals.map((e, i) => {
    if (type === 'HC0') return e * e;
    if (type === 'HC1') return (e * e * n) / (n - p);
    return (e * e) / (1 - hat[i]) ** 2;
  });
  const meat = crossprod(X, w);
  // bread · meat · bread
  const p2 = xtxInv.length;
  const tmp = xtxInv.map((row) => {
    const out = new Array<number>(p2).fill(0);
    for (let k = 0; k < p2; k++) for (let j = 0; j < p2; j++) out[j] += row[k] * meat[k][j];
    return out;
  });
  return tmp.map((row) => {
    const out = new Array<number>(p2).fill(0);
    for (let k = 0; k < p2; k++) for (let j = 0; j < p2; j++) out[j] += row[k] * xtxInv[k][j];
    return out;
  });
}

export interface CoefTable {
  name: string;
  estimate: number;
  se: number;
  stat: number;
  p: number;
  ciLow: number;
  ciHigh: number;
}

export function coefTable(fit: OLSFit, vcovType: 'classical' | HCType = 'classical', level = 0.95): CoefTable[] {
  const V = vcovType === 'classical' ? fit.vcov : robustVcov(fit, vcovType);
  const tq = tQuantile(1 - (1 - level) / 2, fit.dfResid);
  return fit.names.map((name, j) => {
    const se = Math.sqrt(V[j][j]);
    const stat = fit.coef[j] / se;
    return {
      name,
      estimate: fit.coef[j],
      se,
      stat,
      p: tPValue(stat, fit.dfResid),
      ciLow: fit.coef[j] - tq * se,
      ciHigh: fit.coef[j] + tq * se,
    };
  });
}

/**
 * Studentized Breusch–Pagan test (Koenker 1981), the default of R's lmtest::bptest:
 * regress squared residuals on the model's regressors; LM = n·R² ~ χ²(p − 1).
 */
export function breuschPagan(fit: OLSFit): { statistic: number; df: number; p: number } {
  const e2 = fit.residuals.map((e) => e * e);
  const aux = fitOLS(fit.X, e2, fit.names);
  const statistic = fit.n * aux.r2;
  const df = fit.p - (fit.hasIntercept ? 1 : 0);
  return { statistic, df, p: chiSquarePValue(statistic, df) };
}

export function predictOLS(fit: OLSFit, Xnew: Matrix): number[] {
  return Xnew.map((r) => fit.keptColumns.reduce((s, j, k) => s + r[j] * fit.coef[k], 0));
}

/**
 * Simple OLS for one predictor (fast path used in high-volume simulations).
 */
export function simpleRegression(x: readonly number[], y: readonly number[]) {
  const n = x.length;
  const mx = mean(x), my = mean(y);
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  let rss = 0;
  for (let i = 0; i < n; i++) rss += (y[i] - intercept - slope * x[i]) ** 2;
  const sigma = Math.sqrt(rss / (n - 2));
  return { slope, intercept, seSlope: sigma / Math.sqrt(sxx), sigma, sxx, mx };
}

/**
 * Huber M-estimator (k = 1.345, 95% efficiency under normal errors) by IRLS,
 * with the scale re-estimated each iteration as MAD(residuals)/0.6745.
 */
export function fitHuber(X: Matrix, y: readonly number[], k = 1.345, maxIter = 100): { coef: number[]; weights: number[]; scale: number; converged: boolean } {
  const n = X.length;
  const yy = [...y];
  let coef = matVec(invertSPD(crossprod(X)), crossprodVec(X, yy));
  let weights = new Array<number>(n).fill(1);
  let scale = 1;
  let converged = false;
  for (let it = 0; it < maxIter; it++) {
    const res = yy.map((v, i) => v - X[i].reduce((s, x, j) => s + x * coef[j], 0));
    scale = median(res.map((r) => Math.abs(r))) / 0.6745 || 1e-12;
    weights = res.map((r) => {
      const u = Math.abs(r / scale);
      return u <= k ? 1 : k / u;
    });
    const next = matVec(invertSPD(crossprod(X, weights)), crossprodVec(X, yy, weights));
    const delta = Math.max(...next.map((b, j) => Math.abs(b - coef[j]) / (Math.abs(coef[j]) + 1e-8)));
    coef = next;
    if (delta < 1e-10) { converged = true; break; }
  }
  return { coef, weights, scale, converged };
}
