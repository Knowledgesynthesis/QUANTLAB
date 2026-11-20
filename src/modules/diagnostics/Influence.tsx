import { useMemo, useState } from 'react';
import { Rng, fitOLS, fitHuber, tPValue, fQuantile } from '@/lib/stats';
import { Plot, Dots, Line, DragHandle, HoverLayer } from '@/components/plot/Plot';
import { Button, Callout, Checkbox, Code, DataTable, Formula, Legend } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { cn, fmt, fmtP } from '@/lib/utils';
import { DiagnosticPanel } from './plots';

const base = (() => {
  const rng = new Rng('influence-base');
  return Array.from({ length: 24 }, () => {
    const x = 1 + rng.uniform() * 9;
    return { x, y: 2 + 0.8 * x + rng.normal(0, 1.2) };
  });
})();

const presets = [
  { label: 'Typical point', x: 6, y: 6.9 },
  { label: 'Outlier at the centre', x: 5.5, y: 13 },
  { label: 'High leverage, on trend', x: 19, y: 17.2 },
  { label: 'High leverage, off trend', x: 19, y: 4 },
];

export default function Influence() {
  const [pt, setPt] = useState({ x: 19, y: 4 });
  const [robust, setRobust] = useState(false);
  const all = [...base, pt];
  const n = all.length;
  const X = all.map((d) => [1, d.x]);
  const y = all.map((d) => d.y);
  const fit = useMemo(() => fitOLS(X, y, ['(Intercept)', 'x']), [pt.x, pt.y]); // eslint-disable-line react-hooks/exhaustive-deps
  const without = useMemo(() => fitOLS(base.map((d) => [1, d.x]), base.map((d) => d.y), ['(Intercept)', 'x']), []);
  const huber = useMemo(() => fitHuber(X, y), [pt.x, pt.y]); // eslint-disable-line react-hooks/exhaustive-deps
  const i = n - 1;
  const p = fit.p;
  const h = fit.hat[i], t = fit.studResid[i], D = fit.cooks[i], dfb = fit.dfbetas[i][1], dff = fit.dffits[i];
  const bonf = Math.min(1, n * tPValue(t, n - p - 1));
  const dMedian = fQuantile(0.5, p, n - p);
  const flag = (bad: boolean) => cn('tabular font-semibold', bad ? 'text-critical-text' : 'text-good-text');
  const line = (b0: number, b1: number) => [{ x: 0, y: b0 }, { x: 20, y: b0 + 20 * b1 }];

  return (
    <div>
      <P>
        Three different properties are often confused <Cite ids="belsley1980,cook1977" />:
      </P>
      <DataTable
        head={['Property', 'Question', 'Measure', 'Screening threshold']}
        rows={[
          ['Leverage', 'Are its x-values unusual?', 'Hat value hᵢ', '> 2p/n (here ' + fmt((2 * p) / n, 2) + ')'],
          ['Outlyingness', 'Is its y unusual given x?', 'Externally studentized residual tᵢ', '|t| > 2–3; Bonferroni test'],
          ['Influence', 'Does it change the fit?', "Cook's D, DFBETAS, DFFITS", 'D > 4/n or > F₀.₅(p, n−p); |DFBETAS| > 2/√n'],
        ]}
      />
      <Formula note="Influence ≈ outlyingness × leverage">Dᵢ = rᵢ² · hᵢ / (p (1 − hᵢ))     DFBETASᵢⱼ = (β̂ⱼ − β̂ⱼ₍ᵢ₎) / (s₍ᵢ₎ √[(XᵀX)⁻¹]ⱼⱼ)</Formula>

      <Lab title="Drag-a-point lab" description="Drag the orange point (or focus it and use the arrow keys). The solid line includes it; the dashed line does not.">
        <div className="flex flex-wrap gap-2">
          {presets.map((pr) => (
            <Button key={pr.label} size="sm" variant="outline" onClick={() => setPt({ x: pr.x, y: pr.y })}>{pr.label}</Button>
          ))}
        </div>
        <Plot height={320} xDomain={[0, 20]} yDomain={[-2, 22]} xLabel="x" yLabel="y" ariaLabel="Scatter plot with a draggable point and regression lines with and without it">
          <Line points={line(without.coef[0], without.coef[1])} color="var(--subtle-foreground)" dash="6 4" />
          <Line points={line(fit.coef[0], fit.coef[1])} color="var(--series-1)" width={2.5} />
          {robust && <Line points={line(huber.coef[0], huber.coef[1])} color="var(--series-3)" width={2.5} />}
          <Dots points={base.map((d) => ({ x: d.x, y: d.y }))} r={4} opacity={0.75} />
          <HoverLayer points={base.map((d, k) => ({ ...d, k }))} render={(q) => <span>obs {q.k + 1}: Cook&apos;s D {fmt(fit.cooks[q.k], 3)}</span>} />
          <DragHandle x={pt.x} y={pt.y} onChange={(x, yy) => setPt({ x, y: yy })} clampX={[0, 20]} clampY={[-2, 22]} label="Movable observation" />
        </Plot>
        <Legend items={[{ color: 'var(--series-1)', label: 'OLS with the point', shape: 'line' }, { color: 'var(--subtle-foreground)', label: 'OLS without it', shape: 'line', dashed: true }, ...(robust ? [{ color: 'var(--series-3)', label: 'Huber robust regression', shape: 'line' as const }] : [])]} />
        <Checkbox label="Show Huber robust regression" checked={robust} onChange={setRobust} hint="Down-weights large residuals; note it does not protect against bad leverage points." />
        <DataTable
          head={['Measure (orange point)', 'Value', 'Threshold', 'Flag']}
          align={['l', 'r', 'r', 'c']}
          rows={[
            ['Leverage hᵢ', fmt(h, 3), `> ${fmt((2 * p) / n, 3)}`, <span className={flag(h > (2 * p) / n)}>{h > (2 * p) / n ? 'high' : 'ok'}</span>],
            ['Externally studentized residual', fmt(t, 2), '|t| > 2', <span className={flag(Math.abs(t) > 2)}>{Math.abs(t) > 2 ? 'outlying' : 'ok'}</span>],
            ['Bonferroni outlier p', fmtP(bonf), '< 0.05', <span className={flag(bonf < 0.05)}>{bonf < 0.05 ? 'outlier' : 'ok'}</span>],
            ["Cook's D", fmt(D, 3), `> 4/n = ${fmt(4 / n, 3)}; F-median ${fmt(dMedian, 2)}`, <span className={flag(D > 4 / n)}>{D > dMedian ? 'very influential' : D > 4 / n ? 'influential' : 'ok'}</span>],
            ['DFBETAS (slope)', fmt(dfb, 2), `|·| > ${fmt(2 / Math.sqrt(n), 2)}`, <span className={flag(Math.abs(dfb) > 2 / Math.sqrt(n))}>{Math.abs(dfb) > 2 / Math.sqrt(n) ? 'moves slope' : 'ok'}</span>],
            ['DFFITS', fmt(dff, 2), `|·| > ${fmt(2 * Math.sqrt(p / n), 2)}`, <span className={flag(Math.abs(dff) > 2 * Math.sqrt(p / n))}>{Math.abs(dff) > 2 * Math.sqrt(p / n) ? 'moves its fit' : 'ok'}</span>],
            ['Slope with / without', `${fmt(fit.coef[1], 3)} / ${fmt(without.coef[1], 3)}`, '', ''],
          ]}
        />
        <p className="text-sm text-muted-foreground">
          Try the presets. An outlier at the centre of x has a large residual but little leverage: it shifts the intercept and inflates σ, but barely tilts the line. A
          high-leverage point that follows the trend is harmless; it even improves precision. Only the combination, off-trend at high leverage, is influential.
        </p>
        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-sm font-medium">Show the four diagnostic plots for this fit</summary>
          <div className="mt-3"><DiagnosticPanel fit={fit} height={200} highlight={i} /></div>
        </details>
      </Lab>

      <Callout kind="key" title="What to do with an influential observation">
        <ol className="list-decimal space-y-1 pl-5">
          <li><strong>Check it</strong> against the source. Errors are corrected or set missing (Module 1).</li>
          <li>If it is real, <strong>keep it</strong> and ask what it teaches: a sub-population, a non-linearity, a missing interaction?</li>
          <li>Report a <strong>sensitivity analysis</strong> without it, or use a model that represents it (spline, transformation, robust method).</li>
          <li>Never delete because a threshold was crossed. Thresholds are screening heuristics, not tests.</li>
        </ol>
      </Callout>
      <Callout kind="report">
        "Influence was assessed with Cook's distance and DFBETAS. Three observations exceeded screening thresholds; all were verified as correct. Excluding them changed the
        coefficient for X from 0.81 (95% CI 0.62–1.00) to 0.78 (0.60–0.96); results are reported with all observations (Supplementary Table S4)."
      </Callout>
      <Code
        r={`fit <- lm(y ~ x1 + x2, data = dat)\ninf <- influence.measures(fit); summary(inf)   # flags by standard rules\ncar::outlierTest(fit)                           # Bonferroni on rstudent\ncar::influenceIndexPlot(fit)\nMASS::rlm(y ~ x1 + x2, data = dat)              # Huber M-estimation`}
        py={`infl = fit.get_influence()\nsf = infl.summary_frame()           # cooks_d, dfb_*, dffits, hat_diag, student_resid\nfit.outlier_test(method="bonf")\nimport statsmodels.api as sm\nsm.RLM.from_formula("y ~ x1 + x2", dat, M=sm.robust.norms.HuberT()).fit()`}
      />
      <Takeaways
        items={[
          'Leverage is about x, outlyingness about y given x, influence about the fit; influence needs both.',
          'Use externally studentized residuals so an outlier cannot mask itself.',
          "Cook's D and DFBETAS flag observations to examine, not to delete.",
          'Robust regression resists y-outliers but not bad leverage points; check those directly.',
        ]}
      />
      <CheckYourself ids={['rg-leverage', 'rg-cooks-action', 'rg-studentized']} />
    </div>
  );
}
