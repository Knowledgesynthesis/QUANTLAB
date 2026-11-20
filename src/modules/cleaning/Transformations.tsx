import { useMemo, useState } from 'react';
import { cohort } from '@/data/cohort';
import { fitOLS, skewness, mean, lowess } from '@/lib/stats';
import { Histogram, QQPlot, ResidualPlot } from '@/components/plot/charts';
import { Plot, Dots, Line, extent } from '@/components/plot/Plot';
import { Callout, Code, DataTable, Formula, Segmented, Stat } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { fmt } from '@/lib/utils';

type T = 'none' | 'sqrt' | 'log' | 'inverse' | 'boxcox';

function boxcoxLambda(y: number[]): number {
  const n = y.length;
  const sumLog = y.reduce((s, v) => s + Math.log(v), 0);
  let best = 1, bestLL = -Infinity;
  for (let l = -2; l <= 2.0001; l += 0.01) {
    const z = y.map((v) => (Math.abs(l) < 1e-9 ? Math.log(v) : (v ** l - 1) / l));
    const m = mean(z);
    const s2 = z.reduce((s, v) => s + (v - m) ** 2, 0) / n;
    const ll = (-n / 2) * Math.log(s2) + (l - 1) * sumLog;
    if (ll > bestLL) { bestLL = ll; best = l; }
  }
  return Math.round(best * 100) / 100;
}

function apply(t: T, v: number, lambda: number) {
  if (t === 'sqrt') return Math.sqrt(v);
  if (t === 'log') return Math.log(v);
  if (t === 'inverse') return 1 / v;
  if (t === 'boxcox') return Math.abs(lambda) < 1e-9 ? Math.log(v) : (v ** lambda - 1) / lambda;
  return v;
}

const tLabel: Record<T, string> = { none: 'None', sqrt: '√x', log: 'log x', inverse: '1/x', boxcox: 'Box–Cox' };

export default function Transformations() {
  const c = cohort();
  const [view, setView] = useState<'outcome' | 'predictor'>('outcome');
  const [t, setT] = useState<T>('none');
  const los = c.map((r) => r.los_days);
  const cr = c.map((r) => r.creatinine);
  const lambdaLos = useMemo(() => boxcoxLambda(los), [los]);
  const lambdaCr = useMemo(() => boxcoxLambda(cr), [cr]);

  const outcome = useMemo(() => {
    const y = los.map((v) => apply(t, v, lambdaLos));
    const X = c.map((r) => [1, (r.age - 65) / 10, r.diabetes, r.hypertension, r.hemoglobin - 13.5, Math.log(r.creatinine), r.sex === 'M' ? 1 : 0]);
    const fit = fitOLS(X, y, ['(Intercept)', 'age/10', 'diabetes', 'hypertension', 'hb', 'log cr', 'male']);
    return { y, fit };
  }, [t, c, los, lambdaLos]);

  const predictor = useMemo(() => {
    const x = cr.map((v) => apply(t, v, lambdaCr));
    const y = los.map(Math.log);
    const lo = lowess(x, y, { frac: 0.6 });
    const fit = fitOLS(x.map((v) => [1, v]), y, ['(Intercept)', 'x']);
    return { x, y, lo, fit };
  }, [t, cr, los, lambdaCr]);

  // Retransformation (smearing) on the correctly specified log model
  const smear = useMemo(() => {
    const X = c.map((r) => [1, (r.age - 65) / 10, r.diabetes, r.hypertension, r.hemoglobin - 13.5, Math.log(r.creatinine), r.sex === 'M' ? 1 : 0]);
    const fit = fitOLS(X, los.map(Math.log), ['i', 'a', 'd', 'h', 'hb', 'cr', 'm']);
    const naive = mean(fit.fitted.map(Math.exp));
    const factor = mean(fit.residuals.map(Math.exp));
    return { observed: mean(los), naive, smeared: naive * factor, factor, beta: fit.coef[2] };
  }, [c, los]);

  const lambda = view === 'outcome' ? lambdaLos : lambdaCr;
  const tOptions = (['none', 'sqrt', 'log', 'inverse', 'boxcox'] as T[]).map((v) => ({ value: v, label: v === 'boxcox' ? `Box–Cox λ=${fmt(lambda, 2)}` : tLabel[v] }));

  return (
    <div>
      <P>
        Transform to make a <strong>model</strong> fit: a linear relationship, constant error variance, or effects that act multiplicatively. Do not transform
        just to make a histogram of a variable look normal. Linear regression assumes nothing about the marginal distribution of the outcome or of any predictor
        <Cite ids="gelman2020,lumley2002" />.
      </P>

      <Lab title="Transformation lab" description="Cohort data (n ≈ 600). Compare the variable itself with what matters: the model.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Segmented label="Variable" value={view} onChange={setView} options={[{ value: 'outcome', label: 'LOS as outcome' }, { value: 'predictor', label: 'Creatinine as predictor' }]} />
          <Segmented label="Transformation" size="sm" value={t} onChange={setT} options={tOptions} />
        </div>
        {view === 'outcome' ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Skewness of transformed LOS" value={fmt(skewness(outcome.y), 2)} />
              <Stat label="Skewness of model residuals" value={fmt(skewness(outcome.fit.residuals), 2)} tone={Math.abs(skewness(outcome.fit.residuals)) > 0.5 ? 'warning' : 'good'} />
              <Stat label="R²" value={fmt(outcome.fit.r2, 3)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Histogram values={outcome.y} label={`${tLabel[t]} (LOS)`} height={210} />
              <QQPlot values={outcome.fit.residuals} label="Standardized residuals" height={210} />
            </div>
            <ResidualPlot x={outcome.fit.fitted} y={outcome.fit.residuals} xLabel="Fitted values" yLabel="Residuals" height={220} />
            <p className="text-sm text-muted-foreground">
              Model: transformed LOS ~ age + sex + diabetes + hypertension + hemoglobin + log(creatinine). On the raw scale the residuals fan out and are skewed. On the log scale
              (or Box–Cox λ ≈ {fmt(lambdaLos, 2)}, close to 0 = log) they are symmetric with constant spread, because the data were generated on the log scale. The log is
              usually preferred over the "optimal" λ because its coefficients are interpretable.
            </p>
          </>
        ) : (
          <>
            <Plot height={260} xDomain={extent(predictor.x)} yDomain={extent(predictor.y)} xLabel={`${tLabel[t]} (creatinine)`} yLabel="log(LOS)" ariaLabel="log length of stay versus transformed creatinine with smoother and linear fit">
              <Dots points={predictor.x.map((x, i) => ({ x, y: predictor.y[i] }))} r={3} opacity={0.4} />
              <Line points={predictor.lo.x.map((x, i) => ({ x, y: predictor.lo.y[i] }))} color="var(--series-2)" width={2.5} />
              <Line points={extent(predictor.x, 0).map((x) => ({ x, y: predictor.fit.coef[0] + predictor.fit.coef[1] * x }))} color="var(--series-1)" dash="6 4" />
            </Plot>
            <p className="text-sm text-muted-foreground">
              Orange: LOWESS smoother; blue dashed: straight line. On the raw scale the smoother bends away from the line at high creatinine (a few extreme values
              dominate). On the log scale the relationship is linear. A linear term in log(creatinine) is the right functional form here.
            </p>
          </>
        )}
      </Lab>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Interpreting coefficients after a log transform</h2>
      <DataTable
        head={['Model', 'Coefficient β means…', 'Report as']}
        rows={[
          ['log(Y) ~ X', 'Change in log Y per unit X', 'Ratio of geometric means: exp(β); %-change = 100·(exp(β) − 1)'],
          ['Y ~ log(X)', 'Change in Y per e-fold increase in X', 'Per doubling of X: β·ln 2'],
          ['log(Y) ~ log(X)', 'Elasticity', '% change in Y per 1% change in X ≈ β; per doubling: 2^β'],
        ]}
      />
      <P>
        In the cohort the diabetes coefficient on log(LOS) is {fmt(smear.beta, 3)}: geometric-mean length of stay is {fmt((Math.exp(smear.beta) - 1) * 100, 0)}% higher with diabetes,
        holding the other covariates fixed.
      </P>
      <Callout kind="mistake" title="Back-transforming predicted means">
        exp(mean of log Y) is the geometric mean, which is smaller than the arithmetic mean. Here the observed mean LOS is <strong>{fmt(smear.observed, 2)}</strong> days; naive
        back-transformed predictions average <strong>{fmt(smear.naive, 2)}</strong>; Duan&apos;s smearing estimator (× mean of exp(residuals) = {fmt(smear.factor, 3)}) gives{' '}
        <strong>{fmt(smear.smeared, 2)}</strong> <Cite ids="duan1983" />. For costs or bed-days, where the arithmetic mean matters, consider a GLM with log link instead.
      </Callout>
      <Formula note="Duan's smearing estimator for E[Y | X] after modelling log Y">Ê[Y|X] = exp(Xβ̂) · (1/n) Σ exp(eᵢ)</Formula>
      <Callout kind="warning" title="log(x + 1) and zeros">
        Adding a constant before logging makes results depend on the constant and on the units of x. With many zeros, model them directly (two-part model,
        Poisson/negative binomial for counts, or a spline of x).
      </Callout>
      <Code
        r={`fit <- lm(log(los_days) ~ age + sex + diabetes + hypertension + hemoglobin + log(creatinine), data = dat)\nexp(cbind(ratio = coef(fit), confint(fit)))[-1, ]   # ratios of geometric means\nMASS::boxcox(lm(los_days ~ age + diabetes, data = dat))  # profile likelihood for λ\n# GLM alternative that models the arithmetic mean directly:\nglm(los_days ~ age + diabetes, family = Gamma(link = "log"), data = dat)`}
        py={`import numpy as np, statsmodels.formula.api as smf\nfit = smf.ols("np.log(los_days) ~ age + sex + diabetes + hypertension + hemoglobin + np.log(creatinine)", dat).fit()\nnp.exp(fit.params), np.exp(fit.conf_int())\nimport statsmodels.api as sm\nsmf.glm("los_days ~ age + diabetes", dat, family=sm.families.Gamma(sm.families.links.Log())).fit()`}
      />
      <Takeaways
        items={[
          'Judge transformations by residuals and functional form, not by the histogram of a single variable.',
          'Log transforms turn multiplicative effects into additive ones; report exp(β) as a ratio.',
          'Back-transformed predictions need a smearing correction, or use a log-link GLM.',
          'Prefer interpretable transformations (log, √) over arbitrary Box–Cox λ values.',
        ]}
      />
      <CheckYourself ids={['cl-log-interpret', 'cl-normality-what']} />
    </div>
  );
}
