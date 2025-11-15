/**
 * Statistical utilities for QuantLab interactive visualizations
 */

/**
 * Calculate mean of an array
 */
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculate median
 */
export function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate standard deviation
 */
export function std(arr: number[], sample: boolean = true): number {
  if (arr.length === 0) return 0;
  const mu = mean(arr);
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - mu, 2), 0) / (sample ? arr.length - 1 : arr.length);
  return Math.sqrt(variance);
}

/**
 * Calculate correlation coefficient
 */
export function correlation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const meanX = mean(x);
  const meanY = mean(y);
  const stdX = std(x);
  const stdY = std(y);

  if (stdX === 0 || stdY === 0) return 0;

  let sum = 0;
  for (let i = 0; i < x.length; i++) {
    sum += ((x[i] - meanX) / stdX) * ((y[i] - meanY) / stdY);
  }

  return sum / (x.length - 1);
}

/**
 * Calculate correlation matrix
 */
export function correlationMatrix(data: number[][]): number[][] {
  const n = data.length;
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrix[i][j] = i === j ? 1 : correlation(data[i], data[j]);
    }
  }

  return matrix;
}

/**
 * Simple linear regression
 */
export function linearRegression(x: number[], y: number[]): {
  slope: number;
  intercept: number;
  fitted: number[];
  residuals: number[];
  r2: number;
} {
  if (x.length !== y.length || x.length === 0) {
    return { slope: 0, intercept: 0, fitted: [], residuals: [], r2: 0 };
  }

  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += (x[i] - meanX) * (x[i] - meanX);
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  const fitted = x.map(xi => slope * xi + intercept);
  const residuals = y.map((yi, i) => yi - fitted[i]);

  // Calculate R²
  const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
  const ssTot = y.reduce((sum, yi) => sum + (yi - meanY) * (yi - meanY), 0);
  const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

  return { slope, intercept, fitted, residuals, r2 };
}

/**
 * Calculate leverage (hat values)
 */
export function leverage(x: number[]): number[] {
  const n = x.length;
  const meanX = mean(x);
  const ssX = x.reduce((sum, xi) => sum + (xi - meanX) * (xi - meanX), 0);

  return x.map(xi => 1/n + ((xi - meanX) * (xi - meanX)) / ssX);
}

/**
 * Calculate Cook's distance
 */
export function cooksDistance(
  residuals: number[],
  leverage: number[],
  mse: number,
  p: number
): number[] {
  return residuals.map((r, i) => {
    const h = leverage[i];
    return (r * r * h) / (p * mse * (1 - h) * (1 - h));
  });
}

/**
 * Calculate VIF (Variance Inflation Factor)
 * For each predictor, regress it on all other predictors
 */
export function calculateVIF(data: number[][]): number[] {
  const n = data.length;
  const vifs: number[] = [];

  for (let i = 0; i < n; i++) {
    // Use other predictors to predict this one
    const y = data[i];
    const others = data.filter((_, idx) => idx !== i);

    // Simple approximation: use correlation-based VIF
    // VIF = 1 / (1 - R²)
    // For simplicity, use average correlation with other variables
    let sumCorr = 0;
    for (const x of others) {
      sumCorr += Math.abs(correlation(y, x));
    }
    const avgCorr = others.length > 0 ? sumCorr / others.length : 0;
    const r2 = avgCorr * avgCorr; // Simplified

    vifs.push(r2 >= 0.99 ? 100 : 1 / (1 - r2));
  }

  return vifs;
}

/**
 * Standardize data (z-scores)
 */
export function standardize(arr: number[]): number[] {
  const mu = mean(arr);
  const sigma = std(arr);
  return sigma === 0 ? arr.map(() => 0) : arr.map(x => (x - mu) / sigma);
}

/**
 * Calculate quantiles for QQ plot
 */
export function qqPlotData(residuals: number[]): { theoretical: number[]; sample: number[] } {
  const sorted = [...residuals].sort((a, b) => a - b);
  const n = sorted.length;

  const theoretical: number[] = [];
  const sample: number[] = [];

  for (let i = 0; i < n; i++) {
    // Theoretical quantiles from standard normal
    const p = (i + 0.5) / n;
    // Inverse normal approximation
    const z = inverseNormal(p);
    theoretical.push(z);
    sample.push(sorted[i]);
  }

  return { theoretical, sample };
}

/**
 * Approximate inverse normal distribution
 */
function inverseNormal(p: number): number {
  // Approximation using Beasley-Springer-Moro algorithm
  const a = [
    -3.969683028665376e+01,
    2.209460984245205e+02,
    -2.759285104469687e+02,
    1.383577518672690e+02,
    -3.066479806614716e+01,
    2.506628277459239e+00
  ];

  const b = [
    -5.447609879822406e+01,
    1.615858368580409e+02,
    -1.556989798598866e+02,
    6.680131188771972e+01,
    -1.328068155288572e+01
  ];

  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
    4.374664141464968e+00,
    2.938163982698783e+00
  ];

  const d = [
    7.784695709041462e-03,
    3.224671290700398e-01,
    2.445134137142996e+00,
    3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q, r;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
}

/**
 * K-fold cross-validation split
 */
export function kFoldSplit(n: number, k: number): number[][] {
  const indices = Array.from({ length: n }, (_, i) => i);

  // Shuffle indices
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const foldSize = Math.floor(n / k);
  const folds: number[][] = [];

  for (let i = 0; i < k; i++) {
    const start = i * foldSize;
    const end = i === k - 1 ? n : start + foldSize;
    folds.push(indices.slice(start, end));
  }

  return folds;
}

/**
 * Bootstrap sample
 */
export function bootstrapSample<T>(data: T[]): T[] {
  const n = data.length;
  const sample: T[] = [];

  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * n);
    sample.push(data[idx]);
  }

  return sample;
}

/**
 * Simple imputation methods
 */
export function imputeMean(values: (number | null)[]): number[] {
  const nonNull = values.filter((v): v is number => v !== null);
  const meanValue = mean(nonNull);
  return values.map(v => v === null ? meanValue : v);
}

export function imputeMedian(values: (number | null)[]): number[] {
  const nonNull = values.filter((v): v is number => v !== null);
  const medianValue = median(nonNull);
  return values.map(v => v === null ? medianValue : v);
}
