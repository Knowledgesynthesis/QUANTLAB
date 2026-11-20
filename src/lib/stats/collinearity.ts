/** Collinearity diagnostics: VIF, generalized VIF and Belsley condition indices. */
import { correlationMatrix } from './descriptive';
import { determinant, invertSPD, subMatrix, symmetricEigen, type Matrix } from './matrix';

/**
 * Variance inflation factors for predictor columns (no intercept column).
 * VIF_j = 1 / (1 − R²_j) where R²_j comes from regressing x_j on all other predictors
 * (with intercept). Equivalently, the diagonal of the inverse correlation matrix.
 */
export function vif(columns: readonly (readonly number[])[]): number[] {
  if (columns.length === 1) return [1];
  const R = correlationMatrix(columns);
  try {
    const Rinv = invertSPD(R);
    return Rinv.map((row, j) => row[j]);
  } catch {
    return columns.map(() => Infinity);
  }
}

/**
 * Generalized VIF (Fox & Monette 1992) for terms that span several columns
 * (e.g., the k − 1 dummies of a factor, or spline bases).
 * GVIF = det(R₁₁)·det(R₂₂)/det(R). Report GVIF^(1/(2·df)), comparable to √VIF.
 */
export function gvif(columns: readonly (readonly number[])[], termOf: readonly string[]): { term: string; df: number; gvif: number; adjusted: number }[] {
  const R = correlationMatrix(columns);
  const detR = determinant(R);
  const terms = [...new Set(termOf)];
  const all = columns.map((_, i) => i);
  return terms.map((term) => {
    const idx = all.filter((i) => termOf[i] === term);
    const rest = all.filter((i) => termOf[i] !== term);
    const d1 = determinant(subMatrix(R, idx, idx));
    const d2 = rest.length ? determinant(subMatrix(R, rest, rest)) : 1;
    const g = detR > 0 ? (d1 * d2) / detR : Infinity;
    return { term, df: idx.length, gvif: g, adjusted: Math.pow(g, 1 / (2 * idx.length)) };
  });
}

export interface ConditionDiagnostics {
  /** Singular values of the column-scaled design, descending. */
  singularValues: number[];
  conditionIndex: number[];
  /** proportions[k][j]: share of var(b_j) associated with dimension k (Belsley variance-decomposition proportions). */
  proportions: number[][];
  names: string[];
}

/**
 * Belsley–Kuh–Welsch condition indices: columns of X (including the intercept)
 * are scaled to unit length but NOT centered, as Belsley recommends.
 */
export function conditionIndices(X: Matrix, names: readonly string[]): ConditionDiagnostics {
  const p = X[0].length;
  const norms = Array.from({ length: p }, (_, j) => Math.sqrt(X.reduce((s, r) => s + r[j] * r[j], 0)));
  const Z = X.map((r) => r.map((v, j) => v / norms[j]));
  const ZtZ: Matrix = Array.from({ length: p }, (_, a) => Array.from({ length: p }, (_, b) => Z.reduce((s, r) => s + r[a] * r[b], 0)));
  const { values, vectors } = symmetricEigen(ZtZ);
  const mu = values.map((v) => Math.sqrt(Math.max(v, 0)));
  const ci = mu.map((m) => mu[0] / m);
  // phi[j][k] = v_jk² / mu_k²
  const phi = Array.from({ length: p }, (_, j) => mu.map((m, k) => (vectors[j][k] ** 2) / (m * m)));
  const phiSum = phi.map((row) => row.reduce((s, v) => s + v, 0));
  const proportions = mu.map((_, k) => Array.from({ length: p }, (_, j) => phi[j][k] / phiSum[j]));
  return { singularValues: mu, conditionIndex: ci, proportions, names: [...names] };
}
