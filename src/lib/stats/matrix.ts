/** Small dense linear algebra (row-major number[][]), sized for p ≲ 50. */

export type Matrix = number[][];

export function zeros(r: number, c: number): Matrix {
  return Array.from({ length: r }, () => new Array<number>(c).fill(0));
}

export function identity(n: number): Matrix {
  const I = zeros(n, n);
  for (let i = 0; i < n; i++) I[i][i] = 1;
  return I;
}

export function transpose(A: Matrix): Matrix {
  const r = A.length, c = A[0]?.length ?? 0;
  const T = zeros(c, r);
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) T[j][i] = A[i][j];
  return T;
}

export function matMul(A: Matrix, B: Matrix): Matrix {
  const r = A.length, k = B.length, c = B[0].length;
  const C = zeros(r, c);
  for (let i = 0; i < r; i++) {
    const Ai = A[i], Ci = C[i];
    for (let t = 0; t < k; t++) {
      const a = Ai[t];
      if (a === 0) continue;
      const Bt = B[t];
      for (let j = 0; j < c; j++) Ci[j] += a * Bt[j];
    }
  }
  return C;
}

export function matVec(A: Matrix, v: readonly number[]): number[] {
  return A.map((row) => {
    let s = 0;
    for (let j = 0; j < row.length; j++) s += row[j] * v[j];
    return s;
  });
}

/** XᵀX for an n×p matrix (optionally weighted: XᵀWX). */
export function crossprod(X: Matrix, w?: readonly number[]): Matrix {
  const n = X.length, p = X[0].length;
  const C = zeros(p, p);
  for (let i = 0; i < n; i++) {
    const xi = X[i];
    const wi = w ? w[i] : 1;
    for (let a = 0; a < p; a++) {
      const v = wi * xi[a];
      if (v === 0) continue;
      const Ca = C[a];
      for (let b = a; b < p; b++) Ca[b] += v * xi[b];
    }
  }
  for (let a = 0; a < p; a++) for (let b = 0; b < a; b++) C[a][b] = C[b][a];
  return C;
}

/** Xᵀy (optionally weighted). */
export function crossprodVec(X: Matrix, y: readonly number[], w?: readonly number[]): number[] {
  const p = X[0].length;
  const out = new Array<number>(p).fill(0);
  for (let i = 0; i < X.length; i++) {
    const v = (w ? w[i] : 1) * y[i];
    const xi = X[i];
    for (let a = 0; a < p; a++) out[a] += xi[a] * v;
  }
  return out;
}

/** Cholesky factor L (lower) of a symmetric positive-definite matrix, or null if not PD. */
export function cholesky(A: Matrix): Matrix | null {
  const n = A.length;
  const L = zeros(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) {
        if (s <= 0 || !Number.isFinite(s)) return null;
        L[i][i] = Math.sqrt(s);
      } else {
        L[i][j] = s / L[j][j];
      }
    }
  }
  return L;
}

/** Solve A x = b for SPD A given its Cholesky factor. */
export function choleskySolve(L: Matrix, b: readonly number[]): number[] {
  const n = L.length;
  const z = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i][k] * z[k];
    z[i] = s / L[i][i];
  }
  const x = new Array<number>(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = z[i];
    for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k];
    x[i] = s / L[i][i];
  }
  return x;
}

/** Inverse of an SPD matrix via Cholesky; falls back to Gauss–Jordan. */
export function invertSPD(A: Matrix): Matrix {
  const L = cholesky(A);
  if (!L) return invert(A);
  const n = A.length;
  const inv = zeros(n, n);
  for (let j = 0; j < n; j++) {
    const e = new Array<number>(n).fill(0);
    e[j] = 1;
    const col = choleskySolve(L, e);
    for (let i = 0; i < n; i++) inv[i][j] = col[i];
  }
  return inv;
}

/** General inverse by Gauss–Jordan elimination with partial pivoting. */
export function invert(A: Matrix): Matrix {
  const n = A.length;
  const M = A.map((r, i) => [...r, ...identity(n)[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-14) throw new Error('Matrix is singular');
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col];
    for (let j = 0; j < 2 * n; j++) M[col][j] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      if (f === 0) continue;
      for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[col][j];
    }
  }
  return M.map((r) => r.slice(n));
}

/** Determinant of an SPD matrix (via Cholesky); general fallback by elimination. */
export function determinant(A: Matrix): number {
  const L = cholesky(A);
  if (L) {
    let d = 1;
    for (let i = 0; i < L.length; i++) d *= L[i][i] * L[i][i];
    return d;
  }
  const n = A.length;
  const M = A.map((r) => [...r]);
  let det = 1;
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-300) return 0;
    if (piv !== col) {
      [M[col], M[piv]] = [M[piv], M[col]];
      det = -det;
    }
    det *= M[col][col];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      for (let j = col; j < n; j++) M[r][j] -= f * M[col][j];
    }
  }
  return det;
}

/**
 * Eigen-decomposition of a real symmetric matrix by cyclic Jacobi rotations.
 * Returns eigenvalues in descending order with matching unit eigenvectors (columns).
 */
export function symmetricEigen(A: Matrix): { values: number[]; vectors: Matrix } {
  const n = A.length;
  const a = A.map((r) => [...r]);
  const v = identity(n);
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] * a[i][j];
    if (off < 1e-24) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-300) continue;
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = a[k][p], akq = a[k][q];
          a[k][p] = c * akp - s * akq;
          a[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p][k], aqk = a[q][k];
          a[p][k] = c * apk - s * aqk;
          a[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = v[k][p], vkq = v[k][q];
          v[k][p] = c * vkp - s * vkq;
          v[k][q] = s * vkp + c * vkq;
        }
      }
    }
  }
  const order = a.map((_, i) => i).sort((i, j) => a[j][j] - a[i][i]);
  return {
    values: order.map((i) => a[i][i]),
    vectors: v.map((row) => order.map((i) => row[i])),
  };
}

/** Select a submatrix by row and column index lists. */
export function subMatrix(A: Matrix, rows: readonly number[], cols: readonly number[]): Matrix {
  return rows.map((i) => cols.map((j) => A[i][j]));
}
