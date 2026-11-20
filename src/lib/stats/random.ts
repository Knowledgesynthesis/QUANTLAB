/**
 * Seeded pseudo-random number generation.
 *
 * Every simulation in QuantLab is driven by an explicit seed so that results are
 * reproducible: the same seed always yields the same data, splits and resamples.
 * The core generator is sfc32 (Small Fast Counter, from PractRand), which passes
 * BigCrush-level statistical batteries and is far better than ad-hoc LCGs.
 */

/** Hash a string or number into four 32-bit seed words (cyrb128). */
function cyrb128(input: string): [number, number, number, number] {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < input.length; i++) {
    const k = input.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;
  private spare: number | null = null;

  constructor(seed: number | string = 1) {
    [this.a, this.b, this.c, this.d] = cyrb128(String(seed));
    // Warm up the state.
    for (let i = 0; i < 15; i++) this.next32();
  }

  private next32(): number {
    this.a >>>= 0; this.b >>>= 0; this.c >>>= 0; this.d >>>= 0;
    let t = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) | 0;
    t = (t + this.d) | 0;
    this.c = (this.c + t) | 0;
    return t >>> 0;
  }

  /** Uniform on [0, 1). */
  uniform(): number {
    return this.next32() / 4294967296;
  }

  /** Uniform on (0, 1): never exactly 0, safe for log(). */
  uniformOpen(): number {
    let u = 0;
    while (u === 0) u = this.uniform();
    return u;
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.uniform() * n);
  }

  /** Normal(mean, sd) via the polar Box–Muller method. */
  normal(mean = 0, sd = 1): number {
    if (this.spare !== null) {
      const z = this.spare;
      this.spare = null;
      return mean + sd * z;
    }
    let u: number, v: number, s: number;
    do {
      u = this.uniform() * 2 - 1;
      v = this.uniform() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    const m = Math.sqrt((-2 * Math.log(s)) / s);
    this.spare = v * m;
    return mean + sd * u * m;
  }

  bernoulli(p: number): 0 | 1 {
    return this.uniform() < p ? 1 : 0;
  }

  /** Gamma(shape, scale=1) by Marsaglia & Tsang (2000). */
  gamma(shape: number): number {
    if (shape < 1) {
      const u = this.uniformOpen();
      return this.gamma(1 + shape) * Math.pow(u, 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x: number, v: number;
      do {
        x = this.normal();
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = this.uniformOpen();
      if (u < 1 - 0.0331 * x ** 4) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  /** Chi-square with df degrees of freedom. */
  chiSquare(df: number): number {
    return 2 * this.gamma(df / 2);
  }

  /** Student t with df degrees of freedom. */
  studentT(df: number): number {
    return this.normal() / Math.sqrt(this.chiSquare(df) / df);
  }

  /** Fisher–Yates shuffle (returns a new array). */
  shuffle<T>(arr: readonly T[]): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** n indices drawn with replacement from 0..n-1 (a bootstrap resample). */
  resampleIndices(n: number): number[] {
    const idx = new Array<number>(n);
    for (let i = 0; i < n; i++) idx[i] = this.int(n);
    return idx;
  }

  /** Pick one element. */
  choice<T>(arr: readonly T[]): T {
    return arr[this.int(arr.length)];
  }

  /** Categorical draw given probabilities (need not sum exactly to 1). */
  categorical(probs: readonly number[]): number {
    const total = probs.reduce((s, p) => s + p, 0);
    let u = this.uniform() * total;
    for (let i = 0; i < probs.length; i++) {
      u -= probs[i];
      if (u < 0) return i;
    }
    return probs.length - 1;
  }
}

export function logistic(x: number): number {
  if (x >= 0) {
    const e = Math.exp(-x);
    return 1 / (1 + e);
  }
  const e = Math.exp(x);
  return e / (1 + e);
}

export function logit(p: number): number {
  return Math.log(p / (1 - p));
}
