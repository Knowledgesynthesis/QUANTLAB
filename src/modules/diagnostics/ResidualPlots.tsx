import { useMemo, useState } from 'react';
import { Shuffle, CircleCheck, CircleX } from 'lucide-react';
import { Rng, fitOLS, breuschPagan } from '@/lib/stats';
import { ResidualPlot } from '@/components/plot/charts';
import { Button, Callout, Code, DataTable, SelectField, SliderField, Stat, Tabs } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { cn, fmt, fmtP } from '@/lib/utils';
import { DiagnosticPanel } from './plots';

type Scenario = 'good' | 'nonlinear' | 'hetero' | 'heavy' | 'skewed' | 'autocorr';
const scenarioLabel: Record<Scenario, string> = {
  good: 'Correctly specified',
  nonlinear: 'Non-linear relationship',
  hetero: 'Variance increases with x',
  heavy: 'Heavy-tailed errors (t₃)',
  skewed: 'Right-skewed errors',
  autocorr: 'Autocorrelated errors (time order)',
};
const explanation: Record<Scenario, string> = {
  good: 'Residuals scatter evenly around zero, Q-Q points follow the line, scale-location is flat, no point is near the Cook contours. Even here, expect some wiggle in the smoother and a few points beyond ±2.',
  nonlinear: 'A U-shaped smoother in residuals vs fitted: the mean model is wrong. Coefficients are biased. Add a spline or polynomial term, or transform x.',
  hetero: 'A funnel in plot 1 and a rising trend in scale-location. Coefficients are fine; classical SEs are not. Use HC3 SEs, or model the variance (WLS, log scale, GLM).',
  heavy: 'Q-Q points bend away at both ends (S-shape); a few large residuals. Coefficient inference is approximately fine at moderate n; prediction intervals are not. Consider robust regression.',
  skewed: 'Q-Q curve bends upward at the right end only; residuals vs fitted shows long positive tail. Often fixed by modelling log(y) or using a GLM.',
  autocorr: 'Plots 1–4 can look innocent; the residuals-vs-order plot shows runs (long stretches above or below zero) and Durbin–Watson is far below 2. SEs are too small. Use methods for correlated data.',
};

function simulate(s: Scenario, n: number, seed: number) {
  const rng = new Rng(`resid-${s}-${n}-${seed}`);
  const x = Array.from({ length: n }, () => rng.uniform() * 10);
  let prev = 0;
  const y = x.map((xi) => {
    let e = rng.normal(0, 1.5);
    if (s === 'hetero') e = rng.normal(0, 0.25 + 0.4 * xi);
    if (s === 'heavy') e = 1.2 * rng.studentT(3);
    if (s === 'skewed') e = 1.6 * (Math.exp(rng.normal(0, 0.8)) - Math.exp(0.32));
    if (s === 'autocorr') { e = 0.85 * prev + rng.normal(0, 0.8); prev = e; }
    const mu = s === 'nonlinear' ? 2 + 0.15 * (xi - 5) ** 2 + 0.3 * xi : 2 + 0.8 * xi;
    return mu + e;
  });
  // For autocorrelation, observation order follows x (e.g., time).
  if (s === 'autocorr') x.sort((a, b) => a - b);
  const fit = fitOLS(x.map((v) => [1, v]), y, ['(Intercept)', 'x']);
  const dw = fit.residuals.slice(1).reduce((acc, e, i) => acc + (e - fit.residuals[i]) ** 2, 0) / fit.residuals.reduce((acc, e) => acc + e * e, 0);
  return { x, y, fit, bp: breuschPagan(fit), dw };
}

const scenarios = Object.keys(scenarioLabel) as Scenario[];

export default function ResidualPlots() {
  const [mode, setMode] = useState<'explore' | 'challenge'>('explore');
  const [scenario, setScenario] = useState<Scenario>('hetero');
  const [n, setN] = useState(120);
  const [seed, setSeed] = useState(1);
  const [challenge, setChallenge] = useState(() => ({ s: 'nonlinear' as Scenario, seed: 100 }));
  const [guess, setGuess] = useState<Scenario | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const active = mode === 'explore' ? scenario : challenge.s;
  const sim = useMemo(() => simulate(active, mode === 'explore' ? n : 120, mode === 'explore' ? seed : challenge.seed), [active, n, seed, mode, challenge.seed]);

  const nextChallenge = () => {
    const rng = new Rng(`challenge-${Date.now()}`);
    setChallenge({ s: rng.choice(scenarios), seed: rng.int(1e6) });
    setGuess(null);
  };

  return (
    <div>
      <P>
        Four plots answer most questions about a linear model. Learn what each failure looks like, and also what <em>normal</em> noise looks like, so you neither miss
        problems nor chase random wiggles. The smoother (orange) is LOWESS <Cite ids="cleveland1979" />.
      </P>
      <DataTable
        head={['Plot', 'Checks', 'Problem looks like']}
        rows={[
          ['1. Residuals vs fitted', 'Mean model (linearity, missing terms)', 'Curved smoother; funnel'],
          ['2. Normal Q-Q', 'Shape of the error distribution', 'S-shape (heavy tails); one-sided bend (skew)'],
          ['3. Scale-location', 'Constant variance', 'Smoother trending up or down'],
          ['4. Residuals vs leverage', 'Influential observations', "Points beyond Cook's D contours"],
          ['Residuals vs order / time / cluster', 'Independence', 'Runs; Durbin–Watson far from 2'],
        ]}
      />
      <Lab title="Diagnostic plots lab" actions={<Tabs value={mode} onChange={(m) => { setMode(m); setGuess(null); }} tabs={[{ value: 'explore', label: 'Explore' }, { value: 'challenge', label: 'Challenge' }]} />}>
        {mode === 'explore' ? (
          <div className="grid gap-5 sm:grid-cols-[2fr_2fr_auto] sm:items-end">
            <SelectField label="Data-generating scenario" value={scenario} onChange={setScenario} options={scenarios.map((s) => ({ value: s, label: scenarioLabel[s] }))} />
            <SliderField label="Sample size" value={n} onChange={setN} min={30} max={500} step={10} />
            <Button variant="outline" onClick={() => setSeed((s) => s + 1)}><Shuffle className="h-4 w-4" /> New sample</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">Which scenario generated these data? <span className="tabular text-muted-foreground">Score {score.right}/{score.total}</span></p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {scenarios.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!!guess}
                  onClick={() => { setGuess(s); setScore((sc) => ({ right: sc.right + (s === challenge.s ? 1 : 0), total: sc.total + 1 })); }}
                  className={cn('rounded-lg border px-3 py-2 text-left text-sm', guess && s === challenge.s && 'border-good/60 bg-good-soft', guess === s && s !== challenge.s && 'border-critical/50 bg-critical-soft', !guess && 'hover:border-primary/60')}
                >
                  {scenarioLabel[s]}
                </button>
              ))}
            </div>
            {guess && (
              <div className="flex flex-wrap items-center gap-3">
                <p className={cn('flex items-center gap-1.5 text-sm font-medium', guess === challenge.s ? 'text-good-text' : 'text-critical-text')}>
                  {guess === challenge.s ? <CircleCheck className="h-4 w-4" /> : <CircleX className="h-4 w-4" />}
                  {guess === challenge.s ? 'Correct.' : `It was: ${scenarioLabel[challenge.s]}.`}
                </p>
                <Button size="sm" onClick={nextChallenge}>Next dataset</Button>
              </div>
            )}
          </div>
        )}
        <DiagnosticPanel fit={sim.fit} />
        <ResidualPlot x={sim.fit.residuals.map((_, i) => i + 1)} y={sim.fit.residuals} xLabel="Observation order" yLabel="Residual" height={170} smooth={false} />
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Breusch–Pagan p" value={fmtP(sim.bp.p)} tone={sim.bp.p < 0.05 ? 'warning' : undefined} />
          <Stat label="Durbin–Watson" value={fmt(sim.dw, 2)} sub="≈2 if independent" tone={sim.dw < 1.5 ? 'warning' : undefined} />
          <Stat label="R²" value={fmt(sim.fit.r2, 3)} />
        </div>
        {(mode === 'explore' || guess) && <Callout kind="info" title={scenarioLabel[active]}>{explanation[active]}</Callout>}
      </Lab>
      <Callout kind="warning" title="Tests versus plots">
        With n = 500, Breusch–Pagan flags trivial fanning; with n = 30 it misses serious problems. Use plots to judge the size and form of a problem, and tests at most as
        supporting evidence <Cite ids="breusch1979" />. Change the sample size above to see this.
      </Callout>
      <Code
        r={`fit <- lm(y ~ x, data = dat)\npar(mfrow = c(2, 2)); plot(fit)          # the four plots\nperformance::check_model(fit)            # richer panel (easystats)\nlmtest::bptest(fit)                      # studentized Breusch–Pagan\nlmtest::dwtest(fit)                      # only meaningful for ordered data`}
        py={`import statsmodels.api as sm, statsmodels.formula.api as smf\nfrom statsmodels.stats.diagnostic import het_breuschpagan\nfrom statsmodels.stats.stattools import durbin_watson\nfit = smf.ols("y ~ x", dat).fit()\nsm.graphics.plot_regress_exog(fit, "x")\nsm.qqplot(fit.get_influence().resid_studentized_external, line="45")\nhet_breuschpagan(fit.resid, fit.model.exog); durbin_watson(fit.resid)`}
      />
      <Takeaways
        items={[
          'Residuals vs fitted checks the mean model; scale-location checks variance; Q-Q checks error shape; leverage plot checks influence.',
          'Independence is judged from the design and residuals vs time or cluster, not from the standard four plots.',
          'Learn what random noise looks like; small samples wiggle.',
          'Let plots, not p-values from assumption tests, drive decisions.',
        ]}
      />
      <CheckYourself ids={['rg-funnel', 'rg-qq-large-n', 'rg-bp-large-n']} />
    </div>
  );
}
