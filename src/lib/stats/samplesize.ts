/**
 * Minimum sample size for developing a clinical prediction model with a binary
 * outcome (Riley et al. BMJ 2020;368:m441), reproducing pmsampsize.
 */
export interface BinarySampleSizeInput {
  /** Number of candidate predictor parameters (count every df: dummies, spline terms). */
  parameters: number;
  /** Anticipated outcome proportion. */
  prevalence: number;
  /** Anticipated Cox–Snell R². If omitted, a conservative 15% of the maximum is used. */
  coxSnellR2?: number;
  /** Target expected uniform shrinkage factor (default 0.9). */
  shrinkage?: number;
  /** Acceptable difference between apparent and adjusted Nagelkerke R² (default 0.05). */
  delta?: number;
  /** Margin of error for the overall risk (default 0.05). */
  margin?: number;
}

export interface BinarySampleSizeResult {
  maxR2cs: number;
  r2cs: number;
  criterion1: number;
  criterion2: number;
  criterion3: number;
  shrinkageCriterion2: number;
  n: number;
  events: number;
  epp: number;
  binding: 1 | 2 | 3;
}

export function maxCoxSnellR2(prevalence: number): number {
  const phi = prevalence;
  const lnLnull = phi * Math.log(phi) + (1 - phi) * Math.log(1 - phi);
  return 1 - Math.exp(2 * lnLnull);
}

export function binaryOutcomeSampleSize(input: BinarySampleSizeInput): BinarySampleSizeResult {
  const { parameters: p, prevalence: phi } = input;
  const S = input.shrinkage ?? 0.9;
  const delta = input.delta ?? 0.05;
  const margin = input.margin ?? 0.05;
  const maxR2 = maxCoxSnellR2(phi);
  const r2 = input.coxSnellR2 ?? 0.15 * maxR2;

  // Criterion 1: expected shrinkage ≥ S.
  const c1 = Math.ceil(p / ((S - 1) * Math.log(1 - r2 / S)));
  // Criterion 2: small optimism in apparent Nagelkerke R².
  const sVH = r2 / (r2 + delta * maxR2);
  const c2 = Math.ceil(p / ((sVH - 1) * Math.log(1 - r2 / sVH)));
  // Criterion 3: precise estimate of the overall outcome risk.
  const c3 = Math.ceil((1.96 / margin) ** 2 * phi * (1 - phi));
  const n = Math.max(c1, c2, c3);
  const binding = n === c1 ? 1 : n === c2 ? 2 : 3;
  return {
    maxR2cs: maxR2, r2cs: r2, criterion1: c1, criterion2: c2, criterion3: c3, shrinkageCriterion2: sVH,
    n, events: Math.ceil(n * phi), epp: (n * phi) / p, binding,
  };
}
