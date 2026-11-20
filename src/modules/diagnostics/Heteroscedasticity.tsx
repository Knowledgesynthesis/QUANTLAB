import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { Rng, fitOLS, coefTable, breuschPagan } from '@/lib/stats';
import { Plot, Dots, Line, extent } from '@/components/plot/Plot';
import { ResidualPlot } from '@/components/plot/charts';
import { Button, Callout, Code, DataTable, SliderField, Stat } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { cn, defer, fmt, fmtP, pct } from '@/lib/utils';

function gen(n: number, gamma: number, rng: Rng) {
  // Right-skewed x (a few high-leverage points), error SD proportional to x^gamma.
  const x = Array.from({ length: n }, () => Math.exp(rng.normal(0, 0.6)));
  const y = x.map((xi) => 1 + 0.5 * xi + rng.normal(0, 0.6 * Math.pow(xi, gamma)));
  return { x, y };
}

interface Cov { classical: number; hc0: number; hc3: number; reps: number }

function coverage(n: number, gamma: number, reps: number, seed: number): Cov {
  const rng = new Rng(`hc-${n}-${gamma}-${seed}`);
  let c = 0, h0 = 0, h3 = 0;
  for (let r = 0; r < reps; r++) {
    const { x, y } = gen(n, gamma, rng);
    const fit = fitOLS(x.map((v) => [1, v]), y, ['i', 'x']);
    const covers = (row: { ciLow: number; ciHigh: number }) => row.ciLow <= 0.5 && 0.5 <= row.ciHigh;
    if (covers(coefTable(fit, 'classical')[1])) c++;
    if (covers(coefTable(fit, 'HC0')[1])) h0++;
    if (covers(coefTable(fit, 'HC3')[1])) h3++;
  }
  return { classical: c / reps, hc0: h0 / reps, hc3: h3 / reps, reps };
}

export default function Heteroscedasticity() {
  const [gamma, setGamma] = useState(1);
  const [n, setN] = useState(60);
  const [seed, setSeed] = useState(1);
  const [cov, setCov] = useState<Cov | null>(null);
  const [running, setRunning] = useState(false);
  const one = useMemo(() => {
    const d = gen(n, gamma, new Rng(`hc-one-${n}-${gamma}`));
    const fit = fitOLS(d.x.map((v) => [1, v]), d.y, ['(Intercept)', 'x']);
    return { ...d, fit, classical: coefTable(fit, 'classical')[1], hc3: coefTable(fit, 'HC3')[1], bp: breuschPagan(fit) };
  }, [n, gamma]);
  const run = async () => {
    setRunning(true);
    setCov(await defer(() => coverage(n, gamma, 1000, seed)));
    setSeed((s) => s + 1);
    setRunning(false);
  };
  const mcse = (p: number) => Math.sqrt((p * (1 - p)) / 1000);
  const xd = extent(one.x, 0.03);

  return (
    <div>
      <P>
        When error variance changes with the predictors, OLS coefficients remain unbiased but the classical standard error formula, which assumes one common variance, is
        wrong. Usually it is too small where high-leverage observations also have high variance. Sandwich ("heteroscedasticity-consistent") standard errors estimate the
        variance without that assumption <Cite ids="white1980" />; HC3, which inflates each squared residual by 1/(1 − hᵢ)², performs best in small and moderate samples
        <Cite ids="longervin2000" />.
      </P>
      <Lab title="Coverage simulation" description="y = 1 + 0.5x + ε, with SD(ε) ∝ x^γ and right-skewed x. Does the 95% CI for the slope cover 0.5 in 95% of samples?">
        <div className="grid gap-5 sm:grid-cols-2">
          <SliderField label="Heteroscedasticity γ" value={gamma} onChange={setGamma} min={0} max={1.5} step={0.25} format={(v) => (v === 0 ? '0 (constant variance)' : v.toFixed(2))} />
          <SliderField label="Sample size n" value={n} onChange={setN} min={20} max={400} step={20} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Plot height={220} xDomain={xd} yDomain={extent(one.y)} xLabel="x" yLabel="y" ariaLabel="One simulated dataset with fitted line">
            <Dots points={one.x.map((x, i) => ({ x, y: one.y[i] }))} r={3} opacity={0.55} />
            <Line points={xd.map((x) => ({ x, y: one.fit.coef[0] + one.fit.coef[1] * x }))} />
          </Plot>
          <ResidualPlot x={one.fit.fitted} y={one.fit.residuals} xLabel="Fitted" yLabel="Residual" height={220} />
        </div>
        <DataTable
          caption="This sample"
          head={['', 'Slope', 'SE', '95% CI']}
          align={['l', 'r', 'r', 'r']}
          rows={[
            ['Classical', fmt(one.classical.estimate, 3), fmt(one.classical.se, 3), `${fmt(one.classical.ciLow, 3)} to ${fmt(one.classical.ciHigh, 3)}`],
            ['HC3', fmt(one.hc3.estimate, 3), fmt(one.hc3.se, 3), `${fmt(one.hc3.ciLow, 3)} to ${fmt(one.hc3.ciHigh, 3)}`],
          ]}
        />
        <p className="text-xs text-muted-foreground">Breusch–Pagan p = {fmtP(one.bp.p)}. The point estimate is identical; only the uncertainty differs.</p>
        <Button onClick={run} disabled={running}><Play className="h-4 w-4" /> {running ? 'Simulating 1,000 samples…' : 'Simulate 1,000 samples'}</Button>
        {cov && (
          <div className="grid grid-cols-3 gap-3">
            {([['Classical SE', cov.classical], ['HC0 (White)', cov.hc0], ['HC3', cov.hc3]] as const).map(([label, v]) => (
              <Stat key={label} label={`${label} coverage`} value={pct(v, 1)} sub={`±${pct(1.96 * mcse(v), 1)} MC error`} tone={v < 0.92 ? 'critical' : v < 0.94 ? 'warning' : 'good'} />
            ))}
          </div>
        )}
        {cov && <p className={cn('text-sm text-muted-foreground')}>Nominal coverage is 95%. Set γ = 0: all three are close to 95%, so HC3 costs little when variance is constant.</p>}
      </Lab>
      <h2 className="mt-8 mb-3 text-lg font-semibold">Options</h2>
      <DataTable
        head={['Approach', 'Effect', 'Use when']}
        rows={[
          ['HC3 robust SEs', 'Valid inference; coefficients unchanged', 'Default insurance for any linear model with n in the tens to hundreds'],
          ['Log-transform the outcome', 'Changes the estimand to ratios of geometric means', 'Variance grows with the mean and multiplicative effects make sense'],
          ['GLM (gamma or Poisson with log link)', 'Models variance as a function of the mean', 'Positive skewed outcomes such as costs and LOS'],
          ['Weighted least squares', 'Efficient if the variance function is right', 'Variance structure known (e.g., averages of different group sizes)'],
          ['Cluster-robust SEs', 'Allow correlation within clusters', 'Repeated measures or patients within sites (≥ ~30 clusters)'],
        ]}
      />
      <Callout kind="mistake" title="Robust SEs do not fix a wrong mean model">
        Sandwich SEs make inference valid for the coefficients of the model you fitted. If the relationship is non-linear, those coefficients are still the wrong summary.
      </Callout>
      <Code
        r={`library(sandwich); library(lmtest)\nfit <- lm(y ~ x, data = dat)\ncoeftest(fit, vcov. = vcovHC(fit, type = "HC3"))\ncoefci(fit, vcov. = vcovHC(fit, type = "HC3"))\n# clustered by site:\ncoeftest(fit, vcov. = vcovCL(fit, cluster = ~ site))`}
        py={`fit = smf.ols("y ~ x", dat).fit(cov_type="HC3")\nprint(fit.summary())\n# clustered by site:\nsmf.ols("y ~ x", dat).fit(cov_type="cluster", cov_kwds={"groups": dat["site"]})`}
      />
      <Takeaways
        items={[
          'Heteroscedasticity biases standard errors, not coefficients.',
          'Classical CIs under-cover when variance rises with leverage; HC3 restores coverage.',
          'HC3 is cheap insurance: it is nearly identical to classical SEs when variance is constant.',
          'Consider whether a log scale or GLM is the better model, not just a variance patch.',
        ]}
      />
      <CheckYourself ids={['rg-funnel']} />
    </div>
  );
}
