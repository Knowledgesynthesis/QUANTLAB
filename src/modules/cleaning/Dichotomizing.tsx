import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { Rng, simpleRegression, tPValue, quantile, median } from '@/lib/stats';
import { Plot, Dots, Line, extent } from '@/components/plot/Plot';
import { Button, Callout, Code, DataTable, Legend, SliderField, Stat } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { defer, pct } from '@/lib/utils';

interface SimResult { reps: number; cont: number; median: number; optimal: number }

function pFromXY(x: number[], y: number[]) {
  const f = simpleRegression(x, y);
  return tPValue(f.slope / f.seSlope, x.length - 2);
}

function simulate(n: number, beta: number, reps: number, seed: number): SimResult {
  const rng = new Rng(`dichot-${seed}-${n}-${beta}`);
  let cont = 0, med = 0, opt = 0;
  const probs = Array.from({ length: 17 }, (_, i) => 0.1 + i * 0.05);
  for (let r = 0; r < reps; r++) {
    const x = Array.from({ length: n }, () => rng.normal());
    const y = x.map((v) => beta * v + rng.normal());
    if (pFromXY(x, y) < 0.05) cont++;
    const m = median(x);
    if (pFromXY(x.map((v) => (v > m ? 1 : 0)), y) < 0.05) med++;
    let best = 1;
    for (const q of probs) {
      const c = quantile(x, q);
      const g = x.map((v) => (v > c ? 1 : 0));
      const p = pFromXY(g, y);
      if (p < best) best = p;
    }
    if (best < 0.05) opt++;
  }
  return { reps, cont: cont / reps, median: med / reps, optimal: opt / reps };
}

export default function Dichotomizing() {
  const [n, setN] = useState(100);
  const [beta, setBeta] = useState(0.25);
  const [seed, setSeed] = useState(1);
  const [res, setRes] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);
  const run = async () => {
    setRunning(true);
    setRes(await defer(() => simulate(n, beta, 400, seed)));
    setSeed((s) => s + 1);
    setRunning(false);
  };
  const sample = useMemo(() => {
    const rng = new Rng(`dichot-sample-${n}-${beta}`);
    const x = Array.from({ length: n }, () => rng.normal());
    const y = x.map((v) => beta * v + rng.normal());
    const m = median(x);
    const f = simpleRegression(x, y);
    const lowMean = y.filter((_, i) => x[i] <= m).reduce((s, v, _, a) => s + v / a.length, 0);
    const highMean = y.filter((_, i) => x[i] > m).reduce((s, v, _, a) => s + v / a.length, 0);
    return { x, y, m, f, lowMean, highMean };
  }, [n, beta]);
  const mcse = (p: number) => Math.sqrt((p * (1 - p)) / 400);
  const xd = extent(sample.x, 0.02);

  return (
    <div>
      <P>
        Turning a continuous measurement into "high/low" feels clinically intuitive. Statistically it is costly: it discards the information within each group,
        assumes risk jumps at the cut-point and is flat elsewhere, and invites data-driven cut-points <Cite ids="altman2006,royston2006" />. Under normality a
        median split keeps only about 2/π ≈ 64% of the information, like throwing away a third of your patients.
      </P>

      <Lab title="Power simulation" description="y = β·x + noise. Each run simulates 400 studies and analyses each one three ways.">
        <div className="grid gap-5 sm:grid-cols-2">
          <SliderField label="Sample size per study (n)" value={n} onChange={setN} min={30} max={300} step={10} />
          <SliderField label="True effect β (SD of y per SD of x)" value={beta} onChange={setBeta} min={0} max={0.6} step={0.05} format={(v) => (v === 0 ? '0 (no effect)' : v.toFixed(2))} hint="Set β = 0 to measure false-positive rates." />
        </div>
        <Plot height={220} xDomain={xd} yDomain={extent(sample.y)} xLabel="Biomarker x (one simulated study)" yLabel="Outcome y" ariaLabel="One simulated study: continuous fit versus median split">
          <Dots points={sample.x.map((x, i) => ({ x, y: sample.y[i] }))} r={3} opacity={0.45} />
          <Line points={xd.map((x) => ({ x, y: sample.f.intercept + sample.f.slope * x }))} color="var(--series-1)" />
          <Line points={[{ x: xd[0], y: sample.lowMean }, { x: sample.m, y: sample.lowMean }, { x: sample.m, y: sample.highMean }, { x: xd[1], y: sample.highMean }]} color="var(--series-2)" />
        </Plot>
        <Legend items={[{ color: 'var(--series-1)', label: 'Continuous (linear) fit', shape: 'line' }, { color: 'var(--series-2)', label: 'Median split: two group means', shape: 'line' }]} />
        <Button onClick={run} disabled={running}><Play className="h-4 w-4" /> {running ? 'Simulating…' : 'Run 400 studies'}</Button>
        {res && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label={beta === 0 ? 'False positives: continuous' : 'Power: continuous'} value={pct(res.cont)} sub={`±${pct(1.96 * mcse(res.cont))}`} tone={beta === 0 ? (res.cont > 0.08 ? 'critical' : 'good') : undefined} />
              <Stat label={beta === 0 ? 'False positives: median split' : 'Power: median split'} value={pct(res.median)} sub={`±${pct(1.96 * mcse(res.median))}`} tone={beta > 0 ? 'warning' : res.median > 0.08 ? 'critical' : 'good'} />
              <Stat label={beta === 0 ? 'False positives: "optimal" cut' : 'Power: "optimal" cut'} value={pct(res.optimal)} sub={`±${pct(1.96 * mcse(res.optimal))}`} tone={beta === 0 && res.optimal > 0.08 ? 'critical' : undefined} />
            </div>
            <p className="text-sm text-muted-foreground">
              {beta === 0
                ? `With no true effect, the continuous and median-split analyses hold the nominal 5% (up to Monte Carlo error), but searching 17 cut-points for the smallest p-value declares "significance" in ${pct(res.optimal)} of studies.`
                : `The median split loses power relative to the continuous analysis. Its "power" figure is not a fair win for the optimal cut: that procedure also rejects far too often when β = 0. Set β to 0 and rerun.`}
            </p>
          </>
        )}
      </Lab>

      <Callout kind="mistake" title="&quot;Optimal&quot; cut-points">
        Choosing the threshold that minimizes the p-value is multiple testing in disguise. Altman et al. reported false-positive rates around 40% with this approach
        and effect sizes that do not replicate <Cite ids="altman1994" />.
      </Callout>
      <h2 className="mt-8 mb-3 text-lg font-semibold">Better alternatives</h2>
      <DataTable
        head={['Need', 'Use']}
        rows={[
          ['Linear relationship', 'The continuous variable as is (or on the log scale)'],
          ['Non-linear relationship', 'Restricted cubic splines (3–5 knots) or fractional polynomials'],
          ['Clinically meaningful thresholds for presentation', 'Model continuously; show predicted risk across the range, then report risk at chosen values'],
          ['Established diagnostic cut-offs (e.g., eGFR < 60)', 'Fine as descriptive categories; for adjustment, prefer the continuous form'],
        ]}
      />
      <Code
        r={`library(rms)\ndd <- datadist(dat); options(datadist = "dd")\nfit <- ols(log(los_days) ~ rcs(age, 4) + diabetes + rcs(egfr, 4), data = dat)\nanova(fit)                      # tests of non-linearity\nplot(Predict(fit, egfr))        # the shape, with CI`}
        py={`import statsmodels.formula.api as smf\n# natural cubic spline basis (patsy's cr()), 4 df\nfit = smf.ols("np.log(los_days) ~ cr(age, df=4) + diabetes + cr(egfr, df=4)", data=dat).fit()\nprint(fit.summary())`}
      />
      <Takeaways
        items={[
          'Dichotomizing at the median wastes about a third of the information.',
          'Data-driven cut-points inflate false positives and exaggerate effects.',
          'Keep continuous variables continuous; use splines for non-linearity.',
          'Categorise for presentation after modelling, not before.',
        ]}
      />
      <CheckYourself ids={['cl-dichotomize', 'cl-optimal-cut']} />
    </div>
  );
}
