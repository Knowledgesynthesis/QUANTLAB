/** Resampling: k-fold assignment, bootstrap confidence intervals. */
import { Rng } from './random';
import { mean, quantileSorted, sd } from './descriptive';
import { normalCdf, normalQuantile, tQuantile } from './distributions';

/**
 * Assign each of n observations to one of k folds (balanced sizes).
 * If `strata` is given (e.g., a binary outcome), folds are balanced within each stratum.
 */
export function foldAssignments(n: number, k: number, rng: Rng, strata?: readonly (number | string)[]): number[] {
  const fold = new Array<number>(n);
  const groups = new Map<string, number[]>();
  for (let i = 0; i < n; i++) {
    const key = strata ? String(strata[i]) : 'all';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(i);
  }
  let offset = 0;
  for (const idx of groups.values()) {
    const shuffled = rng.shuffle(idx);
    shuffled.forEach((obs, j) => {
      fold[obs] = (j + offset) % k;
    });
    offset += shuffled.length;
  }
  return fold;
}

export function bootstrapReplicates<T>(data: readonly T[], statistic: (sample: T[]) => number, B: number, rng: Rng): number[] {
  const out = new Array<number>(B);
  const n = data.length;
  for (let b = 0; b < B; b++) {
    const idx = rng.resampleIndices(n);
    out[b] = statistic(idx.map((i) => data[i]));
  }
  return out;
}

export function percentileInterval(replicates: readonly number[], level = 0.95): [number, number] {
  const s = [...replicates].sort((a, b) => a - b);
  const a = (1 - level) / 2;
  return [quantileSorted(s, a), quantileSorted(s, 1 - a)];
}

/**
 * Bias-corrected and accelerated (BCa) interval (Efron 1987; DiCiccio & Efron 1996).
 * Acceleration is estimated by the jackknife.
 */
export function bcaInterval(data: readonly number[], statistic: (x: number[]) => number, replicates: readonly number[], level = 0.95): [number, number] {
  const theta = statistic([...data]);
  const B = replicates.length;
  const below = replicates.filter((r) => r < theta).length + 0.5 * replicates.filter((r) => r === theta).length;
  const z0 = normalQuantile(Math.min(Math.max(below / B, 1e-6), 1 - 1e-6));
  const n = data.length;
  const jack = new Array<number>(n);
  for (let i = 0; i < n; i++) jack[i] = statistic(data.filter((_, j) => j !== i));
  const jbar = mean(jack);
  let num = 0, den = 0;
  for (const j of jack) {
    const d = jbar - j;
    num += d ** 3;
    den += d ** 2;
  }
  const a = den === 0 ? 0 : num / (6 * Math.pow(den, 1.5));
  const alpha = (1 - level) / 2;
  const adj = (z: number) => normalCdf(z0 + (z0 + z) / (1 - a * (z0 + z)));
  const s = [...replicates].sort((x, y) => x - y);
  return [quantileSorted(s, adj(normalQuantile(alpha))), quantileSorted(s, adj(normalQuantile(1 - alpha)))];
}

/** Classical t interval for a mean. */
export function tInterval(x: readonly number[], level = 0.95): [number, number] {
  const n = x.length;
  const m = mean(x);
  const se = sd(x) / Math.sqrt(n);
  const q = tQuantile(1 - (1 - level) / 2, n - 1);
  return [m - q * se, m + q * se];
}

/** Summaries used to evaluate methods in simulation studies (Morris, White & Crowther 2019). */
export interface SimSummary {
  reps: number;
  meanEstimate: number;
  bias: number;
  biasMCSE: number;
  empiricalSE: number;
  meanModelSE: number;
  coverage: number;
  coverageMCSE: number;
}

export function summarizeSimulation(
  estimates: readonly number[],
  ses: readonly number[],
  lows: readonly number[],
  highs: readonly number[],
  truth: number,
): SimSummary {
  const reps = estimates.length;
  const m = mean(estimates);
  const empSE = sd(estimates);
  const covered = lows.filter((lo, i) => lo <= truth && truth <= highs[i]).length / reps;
  return {
    reps,
    meanEstimate: m,
    bias: m - truth,
    biasMCSE: empSE / Math.sqrt(reps),
    empiricalSE: empSE,
    meanModelSE: mean(ses),
    coverage: covered,
    coverageMCSE: Math.sqrt((covered * (1 - covered)) / reps),
  };
}
