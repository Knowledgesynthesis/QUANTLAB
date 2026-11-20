/**
 * LOWESS (Cleveland 1979): locally weighted linear regression with tricube
 * weights and optional bisquare robustness iterations. Matches
 * statsmodels.nonparametric.lowess(frac, it, delta=0).
 */
export interface LowessOptions {
  frac?: number;
  iterations?: number;
}

export function lowess(xIn: readonly number[], yIn: readonly number[], opts: LowessOptions = {}): { x: number[]; y: number[] } {
  const frac = opts.frac ?? 2 / 3;
  const iterations = opts.iterations ?? 3;
  const order = xIn.map((_, i) => i).sort((a, b) => xIn[a] - xIn[b]);
  const x = order.map((i) => xIn[i]);
  const y = order.map((i) => yIn[i]);
  const n = x.length;
  if (n < 3) return { x, y: [...y] };
  const r = Math.min(n, Math.max(2, Math.floor(frac * n + 1e-5)));
  let robust = new Array<number>(n).fill(1);
  let fitted = new Array<number>(n).fill(0);

  for (let it = 0; it <= iterations; it++) {
    let left = 0;
    for (let i = 0; i < n; i++) {
      // Slide the window of r nearest neighbours.
      while (left + r < n && x[i] - x[left] > x[left + r] - x[i]) left++;
      const right = left + r - 1;
      const h = Math.max(x[i] - x[left], x[right] - x[i]);
      let sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0;
      for (let j = left; j <= right; j++) {
        const d = h > 0 ? Math.abs(x[j] - x[i]) / h : 0;
        let w = d < 1 ? (1 - d * d * d) ** 3 : 0;
        if (h === 0) w = 1;
        w *= robust[j];
        sw += w; swx += w * x[j]; swy += w * y[j]; swxx += w * x[j] * x[j]; swxy += w * x[j] * y[j];
      }
      if (sw <= 0) { fitted[i] = y[i]; continue; }
      const mx = swx / sw, my = swy / sw;
      const vx = swxx / sw - mx * mx;
      if (vx > 1e-12 * (Math.abs(mx) + 1) ** 2) {
        const b = (swxy / sw - mx * my) / vx;
        fitted[i] = my + b * (x[i] - mx);
      } else {
        fitted[i] = my;
      }
    }
    if (it === iterations) break;
    const res = y.map((v, i) => v - fitted[i]);
    const absRes = res.map(Math.abs).sort((a, b) => a - b);
    const m = absRes.length % 2 ? absRes[(absRes.length - 1) / 2] : (absRes[absRes.length / 2 - 1] + absRes[absRes.length / 2]) / 2;
    const s = 6 * m;
    if (s === 0) break;
    robust = res.map((e) => {
      const u = Math.abs(e) / s;
      return u < 1 ? (1 - u * u) ** 2 : 0;
    });
    fitted = [...fitted];
  }
  return { x, y: fitted };
}
