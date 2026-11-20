import { describe, expect, it } from 'vitest';
import ref from './reference.json';
import {
  Rng, fitOLS, robustVcov, breuschPagan, vif, gvif, conditionIndices, fitLogistic, auc, calibration, lowess,
  normalCdf, normalQuantile, tCdf, tQuantile, chiSquarePValue, fPValue, fQuantile, rubinsRules,
  binaryOutcomeSampleSize, coxSnellFromC, mean, sd, quantile, mad, skewness, ranks, rcsBasis, rcsKnots, fitHuber,
  independentColumns, bcaInterval, percentileInterval, bootstrapReplicates, drawNorm, mice, foldAssignments,
  netBenefit, crossprod, invertSPD, symmetricEigen, determinant, correlation,
} from '../index';

const close = (a: number, b: number, tol = 1e-8) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol * Math.max(1, Math.abs(b)));
const closeArr = (a: readonly number[], b: readonly number[], tol = 1e-8) => {
  expect(a.length).toBe(b.length);
  a.forEach((v, i) => close(v, b[i], tol));
};

const { x1, x2, x3, y, yb } = ref.data;
const X = x1.map((_, i) => [1, x1[i], x2[i], x3[i]]);
const names = ['(Intercept)', 'x1', 'x2', 'x3'];

describe('distributions match SciPy', () => {
  it('normal CDF and quantile', () => {
    for (const [z, p] of ref.dist.normCdf) close(normalCdf(z), p, 1e-12);
    for (const [p, z] of ref.dist.normPpf) close(normalQuantile(p), z, 1e-10);
  });
  it('t CDF and quantile', () => {
    for (const [t, df, p] of ref.dist.tCdf) close(tCdf(t, df), p, 1e-11);
    for (const [p, df, q] of ref.dist.tPpf) close(tQuantile(p, df), q, 1e-9);
  });
  it('chi-square and F tails', () => {
    for (const [x, df, p] of ref.dist.chi2Sf) close(chiSquarePValue(x, df), p, 1e-11);
    for (const [f, d1, d2, p] of ref.dist.fSf) close(fPValue(f, d1, d2), p, 1e-11);
    for (const [p, d1, d2, q] of ref.dist.fPpf) close(fQuantile(p, d1, d2), q, 1e-9);
  });
});

describe('OLS matches statsmodels', () => {
  const fit = fitOLS(X, y, names);
  it('coefficients, SEs, p-values, CIs and fit statistics', () => {
    closeArr(fit.coef, ref.ols.coef, 1e-9);
    closeArr(fit.se, ref.ols.se, 1e-9);
    closeArr(fit.pValue, ref.ols.p, 1e-8);
    closeArr(fit.ciLow, ref.ols.ciLow, 1e-9);
    closeArr(fit.ciHigh, ref.ols.ciHigh, 1e-9);
    close(fit.r2, ref.ols.r2, 1e-10);
    close(fit.adjR2, ref.ols.adjR2, 1e-10);
    close(fit.fStat, ref.ols.f, 1e-9);
    close(fit.fP, ref.ols.fP, 1e-8);
    close(fit.sigma, ref.ols.sigma, 1e-10);
  });
  it('influence diagnostics', () => {
    closeArr(fit.hat, ref.ols.hat, 1e-9);
    closeArr(fit.stdResid, ref.ols.stdResid, 1e-9);
    closeArr(fit.studResid, ref.ols.studResid, 1e-9);
    closeArr(fit.cooks, ref.ols.cooks, 1e-9);
    closeArr(fit.dffits, ref.ols.dffits, 1e-9);
    fit.dfbetas.forEach((row, i) => closeArr(row, ref.ols.dfbetas[i], 1e-8));
  });
  it('HC3 robust SEs and Breusch–Pagan', () => {
    const V = robustVcov(fit, 'HC3');
    closeArr(V.map((r, j) => Math.sqrt(r[j])), ref.ols.hc3se, 1e-9);
    const bp = breuschPagan(fit);
    close(bp.statistic, ref.ols.bp.stat, 1e-9);
    close(bp.p, ref.ols.bp.p, 1e-8);
  });
  it('VIF matches statsmodels auxiliary-regression VIF', () => {
    closeArr(vif([x1, x2, x3]), ref.vif, 1e-9);
  });
});

describe('influence identities hold by brute-force refitting', () => {
  const fit = fitOLS(X, y, names);
  it('hat values sum to p', () => close(fit.hat.reduce((s, h) => s + h, 0), fit.p, 1e-10));
  it("Cook's distance and DFBETAS equal leave-one-out refits", () => {
    for (const i of [0, 7, 12, 33]) {
      const Xi = X.filter((_, k) => k !== i);
      const yi = y.filter((_, k) => k !== i);
      const loo = fitOLS(Xi, yi, names);
      const d = fit.coef.map((b, j) => b - loo.coef[j]);
      const xtx = crossprod(X);
      const quad = d.reduce((s, dj, a) => s + dj * xtx[a].reduce((t, v, b) => t + v * d[b], 0), 0);
      close(fit.cooks[i], quad / (fit.p * fit.sigma ** 2), 1e-9);
      const xtxInv = invertSPD(xtx);
      d.forEach((dj, j) => close(fit.dfbetas[i][j], dj / (loo.sigma * Math.sqrt(xtxInv[j][j])), 1e-8));
      // externally studentized residual = scaled leave-one-out prediction error
      const pred = X[i].reduce((s, v, j) => s + v * loo.coef[j], 0);
      const looSE = loo.sigma * Math.sqrt(1 + X[i].reduce((s, v, a) => s + v * invertSPD(crossprod(Xi))[a].reduce((t, w, b) => t + w * X[i][b], 0), 0));
      close(fit.studResid[i], (y[i] - pred) / looSE, 1e-9);
    }
  });
  it('detects aliased columns (dummy-variable trap)', () => {
    const levels = x3.map((v, i) => (v === 1 ? 'a' : i % 2 ? 'b' : 'c'));
    const D = levels.map((l) => [1, l === 'a' ? 1 : 0, l === 'b' ? 1 : 0, l === 'c' ? 1 : 0]);
    expect(independentColumns(D)).toEqual([0, 1, 2]);
    const f = fitOLS(D, y, ['(Intercept)', 'a', 'b', 'c']);
    expect(f.aliased).toEqual(['c']);
  });
});

describe('collinearity diagnostics', () => {
  it('GVIF of single-df terms equals VIF', () => {
    const g = gvif([x1, x2, x3], ['x1', 'x2', 'x3']);
    closeArr(g.map((t) => t.gvif), vif([x1, x2, x3]), 1e-9);
  });
  it('GVIF of a factor is invariant to the reference level', () => {
    const rng = new Rng(3);
    const lv = x1.map((v) => (v > 55 ? 0 : v > 45 ? 1 : 2)).map((l) => (rng.uniform() < 0.2 ? rng.int(3) : l));
    const dum = (ref0: number) => [0, 1, 2].filter((l) => l !== ref0).map((l) => lv.map((v) => (v === l ? 1 : 0)));
    const g0 = gvif([...dum(0), x1, x2], ['f', 'f', 'x1', 'x2']).find((t) => t.term === 'f')!.gvif;
    const g2 = gvif([...dum(2), x1, x2], ['f', 'f', 'x1', 'x2']).find((t) => t.term === 'f')!.gvif;
    close(g0, g2, 1e-9);
  });
  it('condition indices are 1 for orthogonal unit columns', () => {
    const Xo = [[1, 1], [1, -1], [1, 1], [1, -1]];
    const cd = conditionIndices(Xo, ['a', 'b']);
    closeArr(cd.conditionIndex, [1, 1], 1e-10);
    // variance-decomposition proportions sum to 1 for each coefficient
    for (let j = 0; j < 2; j++) close(cd.proportions.reduce((s, row) => s + row[j], 0), 1, 1e-12);
  });
  it('symmetric eigen reconstructs the matrix; determinant matches', () => {
    const A = [[4, 1, 0.5], [1, 3, 0.2], [0.5, 0.2, 2]];
    const { values, vectors } = symmetricEigen(A);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const r = values.reduce((s, l, k) => s + l * vectors[i][k] * vectors[j][k], 0);
      close(r, A[i][j], 1e-12);
    }
    close(determinant(A), values.reduce((s, v) => s * v, 1), 1e-12);
  });
});

describe('logistic regression', () => {
  const fit = fitLogistic(X, yb, names);
  it('matches statsmodels Logit', () => {
    expect(fit.converged).toBe(true);
    closeArr(fit.coef, ref.logit.coef, 1e-7);
    closeArr(fit.se, ref.logit.se, 1e-6);
    close(fit.deviance, ref.logit.deviance, 1e-9);
    close(fit.nullDeviance, ref.logit.nullDeviance, 1e-9);
  });
  it('in-sample calibration of an MLE fit is perfect (slope 1, CITL 0)', () => {
    const c = calibration(yb, fit.fitted);
    close(c.slope, 1, 1e-6);
    close(c.citl, 0, 1e-6);
  });
  it('AUC equals the proportion of concordant pairs', () => {
    let conc = 0, pairs = 0;
    for (let i = 0; i < yb.length; i++) for (let j = 0; j < yb.length; j++) {
      if (yb[i] === 1 && yb[j] === 0) {
        pairs++;
        conc += fit.fitted[i] > fit.fitted[j] ? 1 : fit.fitted[i] === fit.fitted[j] ? 0.5 : 0;
      }
    }
    close(auc(yb, fit.fitted), conc / pairs, 1e-12);
    // AUC is invariant to monotone transformations of the score
    close(auc(yb, fit.fitted.map((p) => Math.log(p) * 3 + 1)), conc / pairs, 1e-12);
  });
  it('Firth gives finite estimates under complete separation', () => {
    const xs = [1, 2, 3, 4, 5, 6, 7, 8];
    const ys = [0, 0, 0, 0, 1, 1, 1, 1];
    const Xs = xs.map((v) => [1, v]);
    const ml = fitLogistic(Xs, ys, ['i', 'x']);
    expect(ml.separation).toBe(true);
    const fr = fitLogistic(Xs, ys, ['i', 'x'], { firth: true });
    expect(Number.isFinite(fr.coef[1])).toBe(true);
    expect(fr.coef[1]).toBeGreaterThan(0);
    expect(fr.coef[1]).toBeLessThan(5);
  });
  it('net benefit of treating nobody is 0 and of a perfect model equals prevalence', () => {
    const p = yb.map((v) => v);
    close(netBenefit(yb, p, 0.2), mean(yb), 1e-12);
    close(netBenefit(yb, yb.map(() => 0), 0.2), 0, 1e-12);
  });
});

describe('LOWESS matches statsmodels', () => {
  it('fitted values agree', () => {
    const r = lowess(x1, y, { frac: 2 / 3, iterations: 3 });
    closeArr(r.x, ref.lowess.x, 1e-12);
    closeArr(r.y, ref.lowess.y, 1e-6);
  });
});

describe('descriptive statistics follow R conventions', () => {
  const v = [2, 4, 4, 4, 5, 5, 7, 9];
  it('mean, sd (n−1), quantile type 7, mad', () => {
    close(mean(v), 5);
    close(sd(v), Math.sqrt(32 / 7));
    close(quantile(v, 0.25), 4);
    close(quantile(v, 0.9), 7.6);
    close(mad(v), 1.4826 * 0.5);
  });
  it('ranks average ties', () => expect(ranks([10, 20, 20, 5])).toEqual([2, 3.5, 3.5, 1]));
  it('skewness is ~0 for symmetric data and positive for right-skewed data', () => {
    close(skewness([1, 2, 3, 4, 5]), 0, 1e-12);
    expect(skewness([1, 1, 1, 2, 2, 3, 10])).toBeGreaterThan(1);
  });
});

describe('seeded RNG', () => {
  it('is reproducible and distributionally sound', () => {
    const a = new Rng(42), b = new Rng(42), c = new Rng(43);
    const sa = Array.from({ length: 5 }, () => a.uniform());
    expect(Array.from({ length: 5 }, () => b.uniform())).toEqual(sa);
    expect(Array.from({ length: 5 }, () => c.uniform())).not.toEqual(sa);
    const r = new Rng('normal-check');
    const z = Array.from({ length: 40000 }, () => r.normal());
    expect(Math.abs(mean(z))).toBeLessThan(0.02);
    expect(Math.abs(sd(z) - 1)).toBeLessThan(0.02);
    const chi = Array.from({ length: 20000 }, () => r.chiSquare(5));
    expect(Math.abs(mean(chi) - 5)).toBeLessThan(0.1);
  });
  it('stratified folds are balanced within strata', () => {
    const strata = Array.from({ length: 103 }, (_, i) => (i < 20 ? 1 : 0));
    const f = foldAssignments(103, 5, new Rng(1), strata);
    for (let k = 0; k < 5; k++) {
      const ev = strata.filter((s, i) => s === 1 && f[i] === k).length;
      expect(ev).toBe(4);
    }
  });
});

describe("Rubin's rules", () => {
  it('pools by hand-computed formulas', () => {
    const r = rubinsRules([1, 2, 3], [1, 1, 1]);
    close(r.estimate, 2);
    close(r.withinVar, 1);
    close(r.betweenVar, 1);
    close(r.totalVar, 1 + 4 / 3);
    const lambda = (4 / 3) / (7 / 3);
    close(r.df, 2 / lambda ** 2);
    close(r.riv, 4 / 3);
  });
  it('Barnard–Rubin df never exceeds complete-data df', () => {
    const r = rubinsRules([1.1, 1.3, 0.9, 1.2, 1.0], [0.04, 0.05, 0.04, 0.05, 0.04], 40);
    expect(r.df).toBeLessThan(40);
    expect(r.df).toBeGreaterThan(0);
  });
});

describe('Riley sample size reproduces pmsampsize', () => {
  it('worked example: R²cs 0.288, 24 parameters, prevalence 0.174', () => {
    const r = binaryOutcomeSampleSize({ parameters: 24, prevalence: 0.174, coxSnellR2: 0.288 });
    expect(r.criterion1).toBe(623);
    expect(r.criterion2).toBe(662);
    expect(r.criterion3).toBe(221);
    expect(r.n).toBe(662);
    expect(r.events).toBe(116);
  });
  it('C-statistic → Cox–Snell R² matches pmsampsize (Python) and gives the same n', () => {
    // pmsampsize(type="b", cstatistic=C, parameters=12, prevalence=0.2): R²cs and final n
    for (const [c, r2, n] of [[0.65, 0.0448, 2351], [0.75, 0.1257, 798], [0.85, 0.2498, 370]]) {
      const est = coxSnellFromC(c, 0.2);
      expect(Math.abs(est - r2)).toBeLessThan(0.0015);
      const res = binaryOutcomeSampleSize({ parameters: 12, prevalence: 0.2, coxSnellR2: Math.round(est * 1e4) / 1e4 });
      expect(Math.abs(res.n - n) / n).toBeLessThan(0.02);
    }
    expect(coxSnellFromC(0.5, 0.2)).toBeCloseTo(0, 6);
  });
});

describe('multiple imputation recovers a regression slope under MAR', () => {
  it('MI (outcome in imputation model) removes most of the complete-case bias when missingness depends on the outcome', () => {
    const rng = new Rng('mi-check');
    const reps = 60, n = 400, truth = 0.5;
    const est: number[] = [], cc: number[] = [];
    for (let r = 0; r < reps; r++) {
      const z = Array.from({ length: n }, () => rng.normal());
      const xv = z.map((zi) => 0.6 * zi + rng.normal(0, 0.8));
      const yv = xv.map((xi, i) => 1 + truth * xi + 0.3 * z[i] + rng.normal());
      // MAR given y: x is missing more often when the (observed) outcome is high
      const xm = xv.map((xi, i) => (rng.uniform() < 1 / (1 + Math.exp(-(yv[i] - 1.5) * 1.5)) ? null : xi));
      const P = z.map((zi, i) => [1, yv[i], zi]);
      const slopes: number[] = [], vars: number[] = [];
      for (let m = 0; m < 10; m++) {
        const xi = drawNorm(xm, P, rng);
        const f = fitOLS(xi.map((v, i) => [1, v, z[i]]), yv, ['i', 'x', 'z']);
        slopes.push(f.coef[1]);
        vars.push(f.se[1] ** 2);
      }
      est.push(rubinsRules(slopes, vars).estimate);
      const ok = xm.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0);
      cc.push(fitOLS(ok.map((i) => [1, xm[i] as number, z[i]]), ok.map((i) => yv[i]), ['i', 'x', 'z']).coef[1]);
    }
    const miBias = Math.abs(mean(est) - truth);
    const ccBias = Math.abs(mean(cc) - truth);
    expect(miBias).toBeLessThan(0.035);
    expect(ccBias).toBeGreaterThan(0.08);
    expect(miBias).toBeLessThan(ccBias / 3);
  });
  it('mice returns m complete datasets', () => {
    const rng = new Rng(9);
    const a = Array.from({ length: 50 }, () => rng.normal());
    const b = a.map((v) => v + rng.normal(0, 0.5));
    const res = mice(
      [{ name: 'a', values: a.map((v, i) => (i % 7 === 0 ? null : v)), method: 'pmm' }, { name: 'b', values: b.map((v, i) => (i % 5 === 0 ? null : v)), method: 'norm' }],
      [{ name: 'c', values: a.map((v) => v * 2) }],
      3,
      rng,
      5,
    );
    expect(res).toHaveLength(3);
    for (const d of res) {
      expect(d.a.every(Number.isFinite)).toBe(true);
      expect(d.b.every(Number.isFinite)).toBe(true);
      // PMM imputes only observed values
      const obs = new Set(a.filter((_, i) => i % 7 !== 0));
      expect(d.a.every((v) => obs.has(v))).toBe(true);
    }
  });
});

describe('bootstrap intervals', () => {
  it('BCa ≈ percentile for symmetric data; both cover the mean', () => {
    const rng = new Rng(11);
    const x = Array.from({ length: 80 }, () => rng.normal(10, 2));
    const reps = bootstrapReplicates(x, (s) => mean(s), 2000, rng);
    const pci = percentileInterval(reps);
    const bci = bcaInterval(x, (s) => mean(s), reps);
    expect(Math.abs(pci[0] - bci[0])).toBeLessThan(0.1);
    expect(pci[0]).toBeLessThan(mean(x));
    expect(bci[1]).toBeGreaterThan(mean(x));
  });
});

describe('restricted cubic splines and robust regression', () => {
  it('rcs basis is linear beyond the outer knots', () => {
    const knots = rcsKnots(x1, 4);
    const f = (v: number) => rcsBasis(v, knots)[2];
    const a = knots[3] + 1, h = 0.5;
    close(f(a + 2 * h) - 2 * f(a + h) + f(a), 0, 1e-9);
    const b = knots[0] - 3;
    close(f(b), 0, 1e-12);
  });
  it('Huber with large k equals OLS', () => {
    const h = fitHuber(X, y, 1e6);
    closeArr(h.coef, ref.ols.coef, 1e-8);
  });
  it('Huber downweights the planted outlier', () => {
    const h = fitHuber(X, y);
    expect(h.weights[7]).toBeLessThan(0.5);
    expect(correlation(h.weights, y)).toBeLessThan(0.5);
  });
});
