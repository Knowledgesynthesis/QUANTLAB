/** Design-matrix helpers: restricted cubic splines and dummy coding. */
import { quantile } from './descriptive';

/** Harrell's default knot locations for restricted cubic splines. */
export function rcsKnots(x: readonly number[], k: 3 | 4 | 5 = 4): number[] {
  const probs: Record<number, number[]> = {
    3: [0.1, 0.5, 0.9],
    4: [0.05, 0.35, 0.65, 0.95],
    5: [0.05, 0.275, 0.5, 0.725, 0.95],
  };
  return probs[k].map((p) => quantile(x, p));
}

/**
 * Restricted (natural) cubic spline basis, parameterised as in Hmisc::rcspline.eval
 * with norm = 2: returns k − 1 columns (x itself plus k − 2 nonlinear terms),
 * linear beyond the outer knots.
 */
export function rcsBasis(x: number, knots: readonly number[]): number[] {
  const k = knots.length;
  const tk = knots[k - 1], tk1 = knots[k - 2];
  const norm = (tk - knots[0]) ** 2;
  const pos3 = (u: number) => (u > 0 ? u * u * u : 0);
  const out = [x];
  for (let j = 0; j < k - 2; j++) {
    const tj = knots[j];
    const term = pos3(x - tj) - (pos3(x - tk1) * (tk - tj)) / (tk - tk1) + (pos3(x - tk) * (tk1 - tj)) / (tk - tk1);
    out.push(term / norm);
  }
  return out;
}

/** Treatment (dummy) coding with an explicit reference level. */
export function dummyCode<T extends string>(values: readonly T[], levels: readonly T[], reference: T): { columns: number[][]; names: string[] } {
  const others = levels.filter((l) => l !== reference);
  return {
    columns: others.map((lvl) => values.map((v) => (v === lvl ? 1 : 0))),
    names: others.map((l) => `${l} (vs ${reference})`),
  };
}
