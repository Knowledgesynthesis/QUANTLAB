/** Reusable statistical charts built on the Plot kit. */
import type { ReactNode } from 'react';
import { Plot, Dots, Line, Bars, HRule, HoverLayer, extent, type Pt } from './Plot';
import { histogram, normalQuantile, lowess } from '@/lib/stats';
import { fmt } from '@/lib/utils';

/** Plotting positions as R's ppoints(). */
export function ppoints(n: number): number[] {
  const a = n <= 10 ? 3 / 8 : 0.5;
  return Array.from({ length: n }, (_, i) => (i + 1 - a) / (n + 1 - 2 * a));
}

export function Histogram({ values, label, color = 'var(--series-1)', height = 220, bins, domain, ariaLabel, children }: { values: number[]; label: string; color?: string; height?: number; bins?: number; domain?: [number, number]; ariaLabel?: string; children?: ReactNode }) {
  const b = histogram(values, { bins, domain });
  const maxCount = Math.max(1, ...b.map((x) => x.count));
  const xd: [number, number] = domain ?? [b[0]?.x0 ?? 0, b[b.length - 1]?.x1 ?? 1];
  return (
    <Plot height={height} xDomain={xd} yDomain={[0, maxCount * 1.08]} xLabel={label} yLabel="Count" ariaLabel={ariaLabel ?? `Histogram of ${label}`}>
      <Bars bins={b} color={color} />
      {children}
      <HoverLayer points={b.map((x) => ({ x: (x.x0 + x.x1) / 2, y: x.count, bin: x }))} render={(p) => <span className="tabular">{fmt(p.bin.x0, 2)} – {fmt(p.bin.x1, 2)}: <b>{p.bin.count}</b></span>} radius={40} />
    </Plot>
  );
}

/** Normal Q-Q plot of (standardized) values with the y = x reference line. */
export function QQPlot({ values, height = 240, standardize = true, label = 'Sample quantiles', color = 'var(--series-1)', ariaLabel }: { values: number[]; height?: number; standardize?: boolean; label?: string; color?: string; ariaLabel?: string }) {
  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  let ys = sorted;
  if (standardize) {
    const m = sorted.reduce((s, v) => s + v, 0) / n;
    const sd = Math.sqrt(sorted.reduce((s, v) => s + (v - m) ** 2, 0) / (n - 1));
    ys = sorted.map((v) => (v - m) / sd);
  }
  const xs = ppoints(n).map(normalQuantile);
  const pts: Pt[] = xs.map((x, i) => ({ x, y: ys[i] }));
  const lim = extent([...xs, ...ys], 0.05);
  return (
    <Plot height={height} xDomain={[lim[0], lim[1]]} yDomain={[lim[0], lim[1]]} xLabel="Theoretical normal quantiles" yLabel={label} ariaLabel={ariaLabel ?? 'Normal Q-Q plot'}>
      <Line points={[{ x: lim[0], y: lim[0] }, { x: lim[1], y: lim[1] }]} color="var(--axis)" dash="5 4" width={1.5} />
      <Dots points={pts} color={color} r={3} opacity={0.7} />
    </Plot>
  );
}

/** Residuals (or any y) vs x with a LOWESS smoother and a zero line. */
export function ResidualPlot({ x, y, xLabel, yLabel, height = 240, smooth = true, zero = true, highlight, ariaLabel, ids }: { x: number[]; y: number[]; xLabel: string; yLabel: string; height?: number; smooth?: boolean; zero?: boolean; highlight?: Set<number>; ariaLabel?: string; ids?: (string | number)[] }) {
  const pts: (Pt & { i: number })[] = x.map((xi, i) => ({ x: xi, y: y[i], i, color: highlight?.has(i) ? 'var(--series-2)' : undefined, r: highlight?.has(i) ? 4.5 : 3 }));
  const lo = smooth && x.length > 5 ? lowess(x, y, { frac: 2 / 3, iterations: 3 }) : null;
  return (
    <Plot height={height} xDomain={extent(x)} yDomain={extent(y, 0.08, zero ? [0] : [])} xLabel={xLabel} yLabel={yLabel} ariaLabel={ariaLabel ?? `${yLabel} versus ${xLabel}`}>
      {zero && <HRule y={0} dash="" color="var(--axis)" />}
      <Dots points={pts} r={3} opacity={0.65} />
      {lo && <Line points={lo.x.map((xx, i) => ({ x: xx, y: lo.y[i] }))} color="var(--series-2)" width={2} />}
      <HoverLayer points={pts} render={(p) => <span className="tabular">{ids ? `#${ids[p.i]} · ` : ''}x {fmt(p.x, 2)}, y {fmt(p.y, 2)}</span>} />
    </Plot>
  );
}
