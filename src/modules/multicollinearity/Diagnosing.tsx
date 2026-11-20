import { useMemo, useState } from 'react';
import { cohort } from '@/data/cohort';
import { fitOLS, vif, gvif, conditionIndices } from '@/lib/stats';
import { Callout, Checkbox, Code, DataTable } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { cn, fmt } from '@/lib/utils';

type Term = 'age' | 'male' | 'bmi' | 'sbp' | 'dbp' | 'creatinine' | 'egfr' | 'hemoglobin' | 'smoking' | 'diabetes' | 'hypertension';
const termLabel: Record<Term, string> = {
  age: 'Age', male: 'Male sex', bmi: 'BMI', sbp: 'Systolic BP', dbp: 'Diastolic BP', creatinine: 'Creatinine', egfr: 'eGFR', hemoglobin: 'Hemoglobin',
  smoking: 'Smoking (3 levels)', diabetes: 'Diabetes', hypertension: 'Hypertension',
};

export default function Diagnosing() {
  const c = cohort();
  const [sel, setSel] = useState<Record<Term, boolean>>({ age: true, male: true, bmi: true, sbp: true, dbp: true, creatinine: true, egfr: true, hemoglobin: true, smoking: true, diabetes: true, hypertension: false });
  const [logCr, setLogCr] = useState(true);
  const res = useMemo(() => {
    const cols: number[][] = [];
    const names: string[] = [];
    const termOf: string[] = [];
    const add = (t: Term, nm: string, v: number[]) => { cols.push(v); names.push(nm); termOf.push(t); };
    (Object.keys(sel) as Term[]).filter((t) => sel[t]).forEach((t) => {
      if (t === 'age') add(t, 'age', c.map((r) => r.age));
      if (t === 'male') add(t, 'male', c.map((r) => (r.sex === 'M' ? 1 : 0)));
      if (t === 'bmi') add(t, 'bmi', c.map((r) => r.bmi));
      if (t === 'sbp') add(t, 'sbp', c.map((r) => r.sbp));
      if (t === 'dbp') add(t, 'dbp', c.map((r) => r.dbp));
      if (t === 'creatinine') add(t, logCr ? 'log(creatinine)' : 'creatinine', c.map((r) => (logCr ? Math.log(r.creatinine) : r.creatinine)));
      if (t === 'egfr') add(t, 'egfr', c.map((r) => r.egfr));
      if (t === 'hemoglobin') add(t, 'hemoglobin', c.map((r) => r.hemoglobin));
      if (t === 'smoking') { add(t, 'former', c.map((r) => (r.smoking === 'former' ? 1 : 0))); add(t, 'current', c.map((r) => (r.smoking === 'current' ? 1 : 0))); }
      if (t === 'diabetes') add(t, 'diabetes', c.map((r) => r.diabetes));
      if (t === 'hypertension') add(t, 'hypertension', c.map((r) => r.hypertension));
    });
    if (cols.length < 2) return null;
    const X = c.map((_, i) => [1, ...cols.map((col) => col[i])]);
    const fit = fitOLS(X, c.map((r) => Math.log(r.los_days)), ['(Intercept)', ...names]);
    const v = vif(cols);
    const g = gvif(cols, termOf);
    const cd = conditionIndices(X, ['(Intercept)', ...names]);
    return { fit, v, g, cd, names, termOf };
  }, [sel, logCr, c]);

  return (
    <div>
      <P>
        Pairwise correlations miss collinearity that involves three or more variables. Use VIF per term, GVIF for multi-column terms, and condition indices to see which
        variables form each near-dependency <Cite ids="belsley1980,fox1992" />. Below, the outcome is log(LOS) in the cohort; choose the predictors.
      </P>
      <Lab title="Cohort diagnostics">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {(Object.keys(termLabel) as Term[]).map((t) => (
            <Checkbox key={t} label={termLabel[t]} checked={sel[t]} onChange={(v) => setSel((s) => ({ ...s, [t]: v }))} />
          ))}
          <Checkbox label="Creatinine on log scale" checked={logCr} onChange={setLogCr} />
        </div>
        {!res ? (
          <p className="text-sm text-critical-text">Choose at least two predictors.</p>
        ) : (
          <>
            <DataTable
              caption="VIF for single-column terms; GVIF^(1/(2·df)) for the smoking factor, comparable with √VIF"
              head={['Term', 'df', 'Coefficient (SE)', 'VIF / GVIF', '√VIF or GVIF^(1/2df)']}
              align={['l', 'r', 'r', 'r', 'r']}
              rows={res.g.map((g) => {
                const cols = res.names.map((nm, k) => ({ nm, k })).filter(({ k }) => res.termOf[k] === g.term);
                const coefCell = cols.map(({ nm, k }) => `${cols.length > 1 ? `${nm}: ` : ''}${fmt(res.fit.coef[k + 1], 4)} (${fmt(res.fit.se[k + 1], 4)})`).join('; ');
                const value = g.df === 1 ? res.v[cols[0].k] : g.gvif;
                const adj = g.df === 1 ? Math.sqrt(value) : g.adjusted;
                return [
                  termLabel[g.term as Term],
                  g.df,
                  <span className="text-xs">{coefCell}</span>,
                  <span className={cn('font-semibold', value > 10 ? 'text-critical-text' : value > 5 ? 'text-warning-text' : '')}>{fmt(value, 2)}</span>,
                  fmt(adj, 2),
                ];
              })}
            />
            <DataTable
              caption="Belsley condition indices with variance-decomposition proportions (columns scaled, not centred). Look for CI > 30 with two or more proportions > 0.5 in the same row."
              head={['Dim', 'Condition index', ...res.cd.names.map((nm) => <span className="font-mono text-[10px]">{nm}</span>)]}
              align={['r', 'r', ...res.cd.names.map(() => 'r' as const)]}
              rows={res.cd.conditionIndex.map((ci, k) => [
                k + 1,
                <span className={cn('font-semibold', ci > 30 ? 'text-critical-text' : ci > 10 ? 'text-warning-text' : '')}>{fmt(ci, 1)}</span>,
                ...res.cd.proportions[k].map((p) => <span className={cn(ci > 10 && p > 0.5 && 'rounded bg-critical-soft px-1 font-semibold text-critical-text')}>{fmt(p, 2)}</span>),
              ])}
              className="text-xs"
            />
          </>
        )}
        <p className="text-sm text-muted-foreground">
          Try: (1) creatinine and eGFR together, then remove eGFR: creatinine&apos;s SE drops sharply. eGFR is computed from creatinine, age and sex, so the VIFs of all three rise
          together; pairwise correlations understate this. (2) Uncheck "log scale": the relationship is non-linear and the VIF falls, but not because the model is better.
          (3) The largest condition index often involves the intercept with age or blood pressure, because uncentred predictors far from zero create a dependency with the
          intercept. Belsley regards this as genuine; whether it matters depends on whether the intercept is of interest.
        </p>
      </Lab>
      <h2 className="mt-8 mb-3 text-lg font-semibold">Thresholds are context, not rules</h2>
      <P>
        VIF &gt; 5 or &gt; 10 and condition index &gt; 30 are conventions. A VIF of 10 means the SE is about 3.2 times larger than with uncorrelated predictors. Whether that
        matters depends on the sample size, the effect size and the question; with a large n a VIF of 20 can still give a precise estimate <Cite ids="obrien2007" />.
      </P>
      <Callout kind="tip" title="What to report">
        State which collinearity diagnostics were examined, which variables were involved, and what you did. Show the effect of including or excluding the involved
        variable on the estimates you interpret.
      </Callout>
      <Code
        r={`fit <- lm(log(los_days) ~ age + sex + bmi + sbp + dbp + log(creatinine) + egfr + smoking, data = dat)\ncar::vif(fit)                          # GVIF and GVIF^(1/(2*Df)) for factors\nperformance::check_collinearity(fit)\nmctest::eigprop(fit)                   # Belsley condition indices + proportions`}
        py={`from statsmodels.stats.outliers_influence import variance_inflation_factor\nX = fit.model.exog                     # includes the intercept column\n[variance_inflation_factor(X, j) for j in range(1, X.shape[1])]\nimport numpy as np\nZ = X / np.linalg.norm(X, axis=0)      # Belsley: scale, do not centre\ns = np.linalg.svd(Z, compute_uv=False); s[0] / s   # condition indices`}
      />
      <Takeaways
        items={[
          'VIF captures multi-variable dependencies that pairwise correlations miss.',
          'Use GVIF^(1/(2·df)) for factors and splines; dummy-level VIFs depend on coding.',
          'Condition indices plus variance proportions show which variables are involved.',
          'Thresholds are conventions; judge the precision of the estimates you need.',
        ]}
      />
      <CheckYourself ids={['mc-gvif']} />
    </div>
  );
}
