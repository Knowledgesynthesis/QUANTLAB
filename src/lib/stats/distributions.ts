/**
 * Probability distributions: log-gamma, regularized incomplete gamma/beta,
 * and the normal, t, chi-square and F distributions.
 * Accuracy is ~1e-12 or better over the ranges used in the app (validated against SciPy).
 */

const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
  1.5056327351493116e-7,
];

export function logGamma(x: number): number {
  if (x < 0.5) {
    // Reflection formula
    return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - logGamma(1 - x);
  }
  x -= 1;
  let a = LANCZOS[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

const EPS = 1e-15;
const FPMIN = 1e-300;

/** Regularized lower incomplete gamma P(a, x). */
export function gammaP(a: number, x: number): number {
  if (x <= 0) return 0;
  if (x < a + 1) {
    let ap = a, sumv = 1 / a, del = sumv;
    for (let n = 0; n < 1000; n++) {
      ap += 1;
      del *= x / ap;
      sumv += del;
      if (Math.abs(del) < Math.abs(sumv) * EPS) break;
    }
    return sumv * Math.exp(-x + a * Math.log(x) - logGamma(a));
  }
  return 1 - gammaQcf(a, x);
}

/** Regularized upper incomplete gamma Q(a, x). */
export function gammaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  if (x < a + 1) return 1 - gammaP(a, x);
  return gammaQcf(a, x);
}

function gammaQcf(a: number, x: number): number {
  let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

function betacf(a: number, b: number, x: number): number {
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 3000; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b). */
export function betaInc(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbt = logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x);
  const bt = Math.exp(lbt);
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Complementary error function via the incomplete gamma function. */
export function erfc(x: number): number {
  if (x < 0) return 2 - erfc(-x);
  return gammaQ(0.5, x * x);
}

export function normalCdf(z: number, mean = 0, sd = 1): number {
  return 0.5 * erfc(-(z - mean) / (sd * Math.SQRT2));
}

export function normalPdf(z: number, mean = 0, sd = 1): number {
  const u = (z - mean) / sd;
  return Math.exp(-0.5 * u * u) / (sd * Math.sqrt(2 * Math.PI));
}

/**
 * Standard normal quantile: Acklam's rational approximation followed by one
 * Halley refinement step (full double precision).
 */
export function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425;
  let x: number;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pLow) {
    const q = p - 0.5;
    const r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  // Halley step
  const e = normalCdf(x) - p;
  const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
  return x - u / (1 + (x * u) / 2);
}

/** Student t CDF. */
export function tCdf(t: number, df: number): number {
  if (!Number.isFinite(df)) return normalCdf(t);
  const x = df / (df + t * t);
  const tail = 0.5 * betaInc(x, df / 2, 0.5);
  return t > 0 ? 1 - tail : tail;
}

/** Two-sided p-value for a t statistic. */
export function tPValue(t: number, df: number): number {
  if (!Number.isFinite(t)) return 0;
  const x = df / (df + t * t);
  return betaInc(x, df / 2, 0.5);
}

/** Two-sided p-value for a z statistic. */
export function zPValue(z: number): number {
  return erfc(Math.abs(z) / Math.SQRT2);
}

/** Student t quantile by Newton iteration on the CDF, started from the normal quantile. */
export function tQuantile(p: number, df: number): number {
  if (!Number.isFinite(df)) return normalQuantile(p);
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;
  let x = normalQuantile(p);
  // Bracket and refine with bisection-safeguarded Newton.
  let lo = -1e6, hi = 1e6;
  for (let i = 0; i < 200; i++) {
    const f = tCdf(x, df) - p;
    if (Math.abs(f) < 1e-15) break;
    if (f > 0) hi = x; else lo = x;
    const dens = Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log(1 + (x * x) / df));
    let next = x - f / dens;
    if (!(next > lo && next < hi) || !Number.isFinite(next)) next = (lo + hi) / 2;
    if (Math.abs(next - x) < 1e-14 * Math.max(1, Math.abs(x))) { x = next; break; }
    x = next;
  }
  return x;
}

export function chiSquareCdf(x: number, df: number): number {
  return gammaP(df / 2, x / 2);
}

/** Upper-tail probability of the chi-square distribution. */
export function chiSquarePValue(x: number, df: number): number {
  return gammaQ(df / 2, x / 2);
}

export function fCdf(f: number, d1: number, d2: number): number {
  if (f <= 0) return 0;
  return betaInc((d1 * f) / (d1 * f + d2), d1 / 2, d2 / 2);
}

export function fPValue(f: number, d1: number, d2: number): number {
  if (f <= 0) return 1;
  return betaInc(d2 / (d2 + d1 * f), d2 / 2, d1 / 2);
}

/** F quantile by bisection (used for Cook's distance reference contours). */
export function fQuantile(p: number, d1: number, d2: number): number {
  let lo = 0, hi = 1;
  while (fCdf(hi, d1, d2) < p) hi *= 2;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (fCdf(mid, d1, d2) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
