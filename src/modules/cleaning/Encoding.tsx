import { useMemo, useState } from 'react';
import { cohort, type Smoking } from '@/data/cohort';
import { fitOLS, mean } from '@/lib/stats';
import { Callout, Code, DataTable, Segmented } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { fmt } from '@/lib/utils';

type Scheme = 'dummy' | 'all' | 'linear';
const levels: Smoking[] = ['never', 'former', 'current'];

export default function Encoding() {
  const c = cohort();
  const [scheme, setScheme] = useState<Scheme>('dummy');
  const [ref, setRef] = useState<Smoking>('never');
  const y = useMemo(() => c.map((r) => Math.log(r.los_days)), [c]);

  const design = useMemo(() => {
    if (scheme === 'linear') {
      const score: Record<Smoking, number> = { never: 0, former: 1, current: 2 };
      return { names: ['(Intercept)', 'smoking score (0/1/2)'], X: c.map((r) => [1, score[r.smoking]]) };
    }
    const lv = scheme === 'all' ? levels : levels.filter((l) => l !== ref);
    return { names: ['(Intercept)', ...lv.map((l) => (scheme === 'all' ? l : `${l} (vs ${ref})`))], X: c.map((r) => [1, ...lv.map((l) => (r.smoking === l ? 1 : 0))]) };
  }, [scheme, ref, c]);

  const fit = useMemo(() => fitOLS(design.X, y, design.names), [design, y]);
  const groupMeans = levels.map((l) => {
    const idx = c.map((r, i) => (r.smoking === l ? i : -1)).filter((i) => i >= 0);
    return { level: l, n: idx.length, observed: mean(idx.map((i) => y[i])), fitted: mean(idx.map((i) => fit.fitted[i])) };
  });
  const example = [0, 1, 2, 3, 4, 5].map((i) => c[i]);

  return (
    <div>
      <P>
        A categorical variable with k levels enters a model with an intercept as <strong>k − 1</strong> indicator ("dummy") columns. Each coefficient is the difference
        from the <strong>reference level</strong>. The choice of reference changes the coefficients you read, not the model: fitted values, predictions and the
        overall test are identical <Cite ids="harrell2015" />.
      </P>

      <Lab title="Design matrix" description="Outcome: log(LOS) in the cohort. Predictor: smoking (never / former / current).">
        <div className="grid gap-4 sm:grid-cols-2">
          <Segmented label="Coding" value={scheme} onChange={setScheme} options={[{ value: 'dummy', label: 'k − 1 dummies' }, { value: 'all', label: 'k dummies' }, { value: 'linear', label: '0/1/2 score' }]} />
          {scheme === 'dummy' && <Segmented label="Reference level" value={ref} onChange={setRef} options={levels.map((l) => ({ value: l, label: l }))} />}
        </div>
        <DataTable
          caption="First six rows of the design matrix X"
          head={['smoking', ...design.names]}
          rows={example.map((r, i) => [r.smoking, ...design.X[i].map((v) => v)])}
          align={['l', ...design.names.map(() => 'r' as const)]}
        />
        {fit.aliased.length > 0 && (
          <Callout kind="mistake" title="Dummy-variable trap">
            The three indicators sum to the intercept column, so one is an exact linear combination of the others. The coefficient for <code>{fit.aliased.join(', ')}</code> is
            not estimable and is dropped, as R reports <code>NA</code> ("1 not defined because of singularities").
          </Callout>
        )}
        <DataTable
          head={['Term', 'Estimate', 'SE', '95% CI']}
          align={['l', 'r', 'r', 'r']}
          rows={fit.names.map((nm, j) => [nm, fmt(fit.coef[j], 3), fmt(fit.se[j], 3), `${fmt(fit.ciLow[j], 3)} to ${fmt(fit.ciHigh[j], 3)}`])}
        />
        <DataTable
          caption="Mean log(LOS) by group: observed vs fitted by this coding"
          head={['Level', 'n', 'Observed', 'Fitted']}
          align={['l', 'r', 'r', 'r']}
          rows={groupMeans.map((g) => [g.level, g.n, fmt(g.observed, 3), <span className={Math.abs(g.observed - g.fitted) > 1e-9 ? 'font-semibold text-warning-text' : ''}>{fmt(g.fitted, 3)}</span>])}
        />
        <p className="text-sm text-muted-foreground">
          {scheme === 'linear'
            ? 'The 0/1/2 score forces equal steps (never→former = former→current). The fitted group means no longer match the observed ones: a substantive assumption, testable by comparing with the dummy model.'
            : 'With dummy coding, fitted values equal the observed group means whatever the reference. Change the reference: coefficients change, fitted values do not.'}
        </p>
      </Lab>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Practical rules</h2>
      <DataTable
        head={['Situation', 'Recommendation']}
        rows={[
          ['Choosing the reference', 'A large, clinically natural group (e.g., never smokers). A tiny reference group gives unstable contrasts.'],
          ['Ordinal variable (NYHA I–IV)', 'Dummies (no spacing assumption) or a linear score if justified; test the difference. Splines on the score are a middle ground.'],
          ['Rare levels', 'Merge with a clinically similar level, pre-specified, never by looking at outcome associations.'],
          ['High cardinality (ICD codes)', 'Group into validated categories (e.g., CCSR, Elixhauser) before modelling.'],
          ['Missing category ("unknown")', 'Not a fix for missing data in confounders; see Module 3 and Groenwold et al.'],
          ['Testing a factor', 'Use a joint (multi-df) test of all its dummies, not the individual p-values.'],
        ]}
      />
      <P>
        For collinearity checks, a factor's dummies are judged together with the generalized VIF <Cite ids="fox1992" /> (Module 5). Individual dummy VIFs depend on the reference level.
      </P>
      <Code
        r={`dat$smoking <- relevel(factor(dat$smoking), ref = "never")\nfit <- lm(log(los_days) ~ smoking + age, data = dat)\nanova(fit)                                   # joint F test for smoking\ncar::Anova(fit, type = 2)                    # same, with other terms adjusted`}
        py={`import statsmodels.formula.api as smf\nfit = smf.ols("np.log(los_days) ~ C(smoking, Treatment('never')) + age", data=dat).fit()\nprint(fit.f_test("C(smoking, Treatment('never'))[T.current] = 0, C(smoking, Treatment('never'))[T.former] = 0"))`}
      />
      <Takeaways
        items={[
          'k levels → k − 1 dummies plus an intercept; k dummies cause perfect collinearity.',
          'The reference level changes the coefficients, never the fit.',
          'Treating ordinal codes as numbers assumes equal spacing; check it.',
          'Test factors jointly; merge rare levels by pre-specified clinical logic.',
        ]}
      />
      <CheckYourself ids={['cl-dummy-trap']} />
    </div>
  );
}
