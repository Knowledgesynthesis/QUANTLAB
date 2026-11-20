/** The four standard lm diagnostic plots, computed from an OLSFit. */
import { Plot, Dots, Line, HRule, HoverLayer, extent } from '@/components/plot/Plot';
import { QQPlot } from '@/components/plot/charts';
import { lowess, type OLSFit } from '@/lib/stats';
import { fmt } from '@/lib/utils';

export function cookContour(D: number, p: number, h: number) {
  return Math.sqrt((D * p * (1 - h)) / h);
}

export function DiagnosticPanel({ fit, height = 220, highlight }: { fit: OLSFit; height?: number; highlight?: number }) {
  const n = fit.n;
  const idx = Array.from({ length: n }, (_, i) => i);
  const color = (i: number) => (i === highlight ? 'var(--series-2)' : undefined);
  const lo1 = lowess(fit.fitted, fit.residuals, { frac: 2 / 3, iterations: 3 });
  const sl = fit.stdResid.map((r) => Math.sqrt(Math.abs(r)));
  const lo3 = lowess(fit.fitted, sl, { frac: 2 / 3, iterations: 3 });
  const hMax = Math.max(...fit.hat) * 1.08;
  const rExt = extent(fit.stdResid, 0.1, [-2.5, 2.5]);
  const hs = Array.from({ length: 60 }, (_, k) => 0.005 + (k / 59) * (hMax - 0.005));
  const topCook = [...idx].sort((a, b) => fit.cooks[b] - fit.cooks[a]).slice(0, 3);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="mb-1 text-sm font-medium">1. Residuals vs fitted</p>
        <Plot height={height} xDomain={extent(fit.fitted)} yDomain={extent(fit.residuals, 0.08, [0])} xLabel="Fitted values" yLabel="Residuals" ariaLabel="Residuals versus fitted values with LOWESS smoother">
          <HRule y={0} dash="" />
          <Dots points={idx.map((i) => ({ x: fit.fitted[i], y: fit.residuals[i], color: color(i), r: i === highlight ? 5 : 3 }))} opacity={0.6} />
          <Line points={lo1.x.map((x, i) => ({ x, y: lo1.y[i] }))} color="var(--series-2)" />
          <HoverLayer points={idx.map((i) => ({ x: fit.fitted[i], y: fit.residuals[i], i }))} render={(p) => <span>obs {p.i + 1}: residual {fmt(p.y, 2)}</span>} />
        </Plot>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium">2. Normal Q-Q of studentized residuals</p>
        <QQPlot values={fit.studResid} standardize={false} label="Externally studentized" height={height} />
      </div>
      <div>
        <p className="mb-1 text-sm font-medium">3. Scale-location</p>
        <Plot height={height} xDomain={extent(fit.fitted)} yDomain={[0, Math.max(...sl) * 1.08]} xLabel="Fitted values" yLabel="√|standardized residual|" ariaLabel="Scale-location plot">
          <Dots points={idx.map((i) => ({ x: fit.fitted[i], y: sl[i], color: color(i), r: i === highlight ? 5 : 3 }))} opacity={0.6} />
          <Line points={lo3.x.map((x, i) => ({ x, y: lo3.y[i] }))} color="var(--series-2)" />
        </Plot>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium">4. Residuals vs leverage (Cook&apos;s D contours 0.5, 1)</p>
        <Plot height={height} xDomain={[0, hMax]} yDomain={rExt} xLabel="Leverage (hat value)" yLabel="Standardized residuals" ariaLabel="Standardized residuals versus leverage with Cook's distance contours">
          <HRule y={0} dash="" />
          {[0.5, 1].map((D) => (
            <g key={D}>
              <Line points={hs.map((h) => ({ x: h, y: cookContour(D, fit.p, h) }))} color="var(--critical)" dash={D === 0.5 ? '5 4' : ''} width={1.5} />
              <Line points={hs.map((h) => ({ x: h, y: -cookContour(D, fit.p, h) }))} color="var(--critical)" dash={D === 0.5 ? '5 4' : ''} width={1.5} />
            </g>
          ))}
          <Dots points={idx.map((i) => ({ x: fit.hat[i], y: fit.stdResid[i], color: color(i) ?? (topCook.includes(i) ? 'var(--series-4)' : undefined), r: i === highlight ? 5 : 3 }))} opacity={0.7} />
          <HoverLayer points={idx.map((i) => ({ x: fit.hat[i], y: fit.stdResid[i], i }))} render={(p) => <span>obs {p.i + 1}: h {fmt(fit.hat[p.i], 3)}, D {fmt(fit.cooks[p.i], 3)}</span>} />
        </Plot>
      </div>
    </div>
  );
}
