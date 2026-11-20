/** Descriptive statistics. Conventions match R defaults unless noted. */

export function sum(x: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i];
  return s;
}

export function mean(x: readonly number[]): number {
  if (x.length === 0) return NaN;
  return sum(x) / x.length;
}

/** Sample variance (denominator n − 1), as R's var(). */
export function variance(x: readonly number[]): number {
  const n = x.length;
  if (n < 2) return NaN;
  const m = mean(x);
  let s = 0;
  for (let i = 0; i < n; i++) s += (x[i] - m) ** 2;
  return s / (n - 1);
}

/** Sample standard deviation (n − 1), as R's sd(). */
export function sd(x: readonly number[]): number {
  return Math.sqrt(variance(x));
}

export function min(x: readonly number[]): number {
  let m = Infinity;
  for (const v of x) if (v < m) m = v;
  return m;
}

export function max(x: readonly number[]): number {
  let m = -Infinity;
  for (const v of x) if (v > m) m = v;
  return m;
}

/** Quantile, type 7 (R and NumPy default): linear interpolation of order statistics. */
export function quantile(x: readonly number[], p: number): number {
  const n = x.length;
  if (n === 0) return NaN;
  const s = [...x].sort((a, b) => a - b);
  return quantileSorted(s, p);
}

export function quantileSorted(s: readonly number[], p: number): number {
  const n = s.length;
  if (n === 0) return NaN;
  const h = (n - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.min(lo + 1, n - 1);
  return s[lo] + (h - lo) * (s[hi] - s[lo]);
}

export function median(x: readonly number[]): number {
  return quantile(x, 0.5);
}

export function iqr(x: readonly number[]): number {
  const s = [...x].sort((a, b) => a - b);
  return quantileSorted(s, 0.75) - quantileSorted(s, 0.25);
}

/** Median absolute deviation, scaled by 1.4826 to be consistent for the SD under normality (as R's mad()). */
export function mad(x: readonly number[], constant = 1.4826): number {
  const m = median(x);
  return constant * median(x.map((v) => Math.abs(v - m)));
}

/** Adjusted Fisher–Pearson skewness G1 (as SAS/SPSS; e1071::skewness type 2). */
export function skewness(x: readonly number[]): number {
  const n = x.length;
  if (n < 3) return NaN;
  const m = mean(x);
  let m2 = 0, m3 = 0;
  for (const v of x) {
    const d = v - m;
    m2 += d * d;
    m3 += d * d * d;
  }
  m2 /= n;
  m3 /= n;
  const g1 = m3 / Math.pow(m2, 1.5);
  return (g1 * Math.sqrt(n * (n - 1))) / (n - 2);
}

export function covariance(x: readonly number[], y: readonly number[]): number {
  const n = x.length;
  const mx = mean(x), my = mean(y);
  let s = 0;
  for (let i = 0; i < n; i++) s += (x[i] - mx) * (y[i] - my);
  return s / (n - 1);
}

/** Pearson correlation. */
export function correlation(x: readonly number[], y: readonly number[]): number {
  const n = x.length;
  if (n !== y.length || n < 2) return NaN;
  const mx = mean(x), my = mean(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return NaN;
  return sxy / Math.sqrt(sxx * syy);
}

/** Correlation matrix of a set of columns. */
export function correlationMatrix(cols: readonly (readonly number[])[]): number[][] {
  const k = cols.length;
  const R: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  for (let i = 0; i < k; i++) {
    R[i][i] = 1;
    for (let j = i + 1; j < k; j++) {
      const r = correlation(cols[i], cols[j]);
      R[i][j] = r;
      R[j][i] = r;
    }
  }
  return R;
}

export function zScores(x: readonly number[]): number[] {
  const m = mean(x), s = sd(x);
  return x.map((v) => (v - m) / s);
}

/** Average ranks (ties get the mean rank), 1-based. */
export function ranks(x: readonly number[]): number[] {
  const idx = x.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const r = new Array<number>(x.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
    i = j + 1;
  }
  return r;
}

export interface Bin {
  x0: number;
  x1: number;
  count: number;
}

/** Freedman–Diaconis bin width, falling back to Sturges for degenerate IQR. */
export function histogram(x: readonly number[], opts: { bins?: number; domain?: [number, number] } = {}): Bin[] {
  const vals = x.filter((v) => Number.isFinite(v));
  if (vals.length === 0) return [];
  const lo = opts.domain?.[0] ?? min(vals);
  const hi = opts.domain?.[1] ?? max(vals);
  let k = opts.bins;
  if (!k) {
    const w = (2 * iqr(vals)) / Math.cbrt(vals.length);
    k = w > 0 ? Math.ceil((hi - lo) / w) : Math.ceil(Math.log2(vals.length) + 1);
    k = Math.max(5, Math.min(40, k));
  }
  const width = (hi - lo) / k || 1;
  const bins: Bin[] = Array.from({ length: k }, (_, i) => ({ x0: lo + i * width, x1: lo + (i + 1) * width, count: 0 }));
  for (const v of vals) {
    if (v < lo || v > hi) continue;
    const b = Math.min(k - 1, Math.floor((v - lo) / width));
    bins[b].count++;
  }
  return bins;
}

export function round(x: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
}
