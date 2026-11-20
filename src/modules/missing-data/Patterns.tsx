import { useMemo, useState } from 'react';
import { messyExtract } from '@/data/messy';
import { applyCleaning, correctChoices, type CleanRow } from '@/data/audit';
import { fitLogistic, mean, tQuantile } from '@/lib/stats';
import { Callout, Code, DataTable, Legend, Segmented } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { fmt, pct } from '@/lib/utils';

const VARS: (keyof CleanRow)[] = ['age', 'sex', 'bmi', 'smoking', 'sbp', 'heart_rate', 'hemoglobin', 'creatinine', 'los_days'];

export default function Patterns() {
  const rows = useMemo(() => applyCleaning(messyExtract().rows, correctChoices).rows, []);
  const [sortBy, setSortBy] = useState<'file' | 'pattern' | 'age'>('pattern');
  const isNA = (r: CleanRow, v: keyof CleanRow) => r[v] === null || r[v] === undefined;
  const patternOf = (r: CleanRow) => VARS.map((v) => (isNA(r, v) ? '1' : '0')).join('');

  const ordered = useMemo(() => {
    const idx = rows.map((_, i) => i);
    if (sortBy === 'pattern') idx.sort((a, b) => patternOf(rows[a]).localeCompare(patternOf(rows[b])));
    if (sortBy === 'age') idx.sort((a, b) => (rows[a].age ?? 999) - (rows[b].age ?? 999));
    return idx.map((i) => rows[i]);
  }, [rows, sortBy]);

  const patterns = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(patternOf(r), (m.get(patternOf(r)) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const complete = patterns.find(([p]) => !p.includes('1'))?.[1] ?? 0;
  const perVar = VARS.map((v) => rows.filter((r) => isNA(r, v)).length);

  // Who is missing BMI?
  const cmp = useMemo(() => {
    const mis = rows.filter((r) => r.bmi === null);
    const obs = rows.filter((r) => r.bmi !== null);
    const f = (g: CleanRow[]) => ({
      n: g.length,
      age: mean(g.filter((r) => r.age !== null).map((r) => r.age as number)),
      siteC: mean(g.map((r) => (r.site === 'C' ? 1 : 0))),
      diabetes: mean(g.map((r) => r.diabetes)),
      los: mean(g.filter((r) => r.los_days !== null).map((r) => r.los_days as number)),
    });
    const use = rows.filter((r) => r.age !== null);
    const X = use.map((r) => [1, ((r.age as number) - 65) / 10, r.site === 'B' ? 1 : 0, r.site === 'C' ? 1 : 0, r.sex === 'M' ? 1 : 0, r.diabetes]);
    const y = use.map((r) => (r.bmi === null ? 1 : 0));
    const fit = fitLogistic(X, y, ['(Intercept)', 'Age (per 10 y)', 'Site B', 'Site C', 'Male', 'Diabetes']);
    const z = tQuantile(0.975, Infinity);
    const ors = fit.names.slice(1).map((nm, k) => ({ nm, or: Math.exp(fit.coef[k + 1]), lo: Math.exp(fit.coef[k + 1] - z * fit.se[k + 1]), hi: Math.exp(fit.coef[k + 1] + z * fit.se[k + 1]), p: fit.pValue[k + 1] }));
    return { mis: f(mis), obs: f(obs), ors };
  }, [rows]);

  const cellH = Math.max(0.6, 260 / ordered.length);
  return (
    <div>
      <P>
        Before choosing a method, describe the missingness: how much, in which variables, in which combinations, and who is affected. These descriptions belong in the
        manuscript <Cite ids="sterne2009,lee2021" />. Below is the cleaned analysis extract from Module 1 ({rows.length} admissions).
      </P>
      <Lab title="Missingness map" description="Each row of pixels is an admission; dark cells are missing.">
        <Segmented label="Order rows by" value={sortBy} onChange={setSortBy} options={[{ value: 'file', label: 'File order' }, { value: 'pattern', label: 'Pattern' }, { value: 'age', label: 'Age' }]} />
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${VARS.length * 64} ${ordered.length * cellH + 34}`} className="w-full min-w-[480px]" role="img" aria-label="Missingness map: rows are admissions, columns are variables, dark cells are missing values">
            {VARS.map((v, j) => (
              <text key={v} x={j * 64 + 32} y={12} textAnchor="middle" className="fill-[var(--muted-foreground)] font-mono text-[10px]">{v}</text>
            ))}
            {VARS.map((v, j) => (
              <text key={`p${v}`} x={j * 64 + 32} y={26} textAnchor="middle" className="fill-[var(--foreground)] text-[10px] font-semibold">{pct(perVar[j] / rows.length, 1)}</text>
            ))}
            <g transform="translate(0,32)">
              {VARS.map((v, j) => <rect key={v} x={j * 64 + 2} y={0} width={60} height={ordered.length * cellH} fill="var(--primary-soft)" />)}
              {ordered.map((r, i) => VARS.map((v, j) => (isNA(r, v) ? <rect key={`${i}-${j}`} x={j * 64 + 2} y={i * cellH} width={60} height={Math.max(cellH, 1)} fill="var(--series-2)" /> : null)))}
            </g>
          </svg>
        </div>
        <Legend items={[{ color: 'var(--primary-soft)', label: 'Observed' }, { color: 'var(--series-2)', label: 'Missing' }]} />
        <p className="text-sm text-muted-foreground">
          Sorted by age, BMI missingness concentrates among older patients: a visual hint that BMI is not MCAR. Sorted by pattern, most incomplete rows miss a single
          variable.
        </p>
        <DataTable
          caption={`Missing-data patterns (1 = missing). ${complete} of ${rows.length} rows (${pct(complete / rows.length)}) are complete; complete-case analysis would use only these.`}
          head={['Rows', ...VARS.map((v) => <span className="font-mono text-[11px]">{v}</span>)]}
          align={['r', ...VARS.map(() => 'c' as const)]}
          rows={patterns.slice(0, 8).map(([p, k]) => [k, ...p.split('').map((ch) => (ch === '1' ? <span className="font-bold text-critical-text">1</span> : <span className="text-muted-foreground">0</span>))])}
        />
      </Lab>

      <Lab title="Who is missing BMI?">
        <DataTable
          head={['', 'BMI missing', 'BMI observed']}
          align={['l', 'r', 'r']}
          rows={[
            ['n', cmp.mis.n, cmp.obs.n],
            ['Mean age (years)', fmt(cmp.mis.age, 1), fmt(cmp.obs.age, 1)],
            ['Site C', pct(cmp.mis.siteC), pct(cmp.obs.siteC)],
            ['Diabetes', pct(cmp.mis.diabetes), pct(cmp.obs.diabetes)],
            ['Mean LOS (days)', fmt(cmp.mis.los, 2), fmt(cmp.obs.los, 2)],
          ]}
        />
        <DataTable
          caption="Logistic regression of 'BMI missing' on observed characteristics"
          head={['Predictor', 'Odds ratio', '95% CI', 'p']}
          align={['l', 'r', 'r', 'r']}
          rows={cmp.ors.map((o) => [o.nm, fmt(o.or, 2), `${fmt(o.lo, 2)} to ${fmt(o.hi, 2)}`, o.p < 0.001 ? '<0.001' : fmt(o.p, 3)])}
        />
        <p className="text-sm text-muted-foreground">
          Missingness is clearly associated with age and site, so MCAR is untenable. That is consistent with MAR given age and site, but cannot prove it: if BMI itself drove
          missingness among patients of the same age and site, the observed data would look the same. Age and site must be in the imputation (or analysis) model.
        </p>
      </Lab>
      <Callout kind="mistake" title="Testing your way to a mechanism">
        A non-significant Little&apos;s test or a non-significant comparison does not establish MCAR; these tests have low power and cannot detect MNAR at all <Cite ids="little1988" />.
        Use the comparisons to choose auxiliary variables, not to justify complete-case analysis.
      </Callout>
      <Code
        r={`library(naniar); library(mice)\nvis_miss(dat, cluster = TRUE)          # missingness map\nmd.pattern(dat, rotate.names = TRUE)   # pattern table\nmiss_var_summary(dat)\nglm(is.na(bmi) ~ age + site + sex + diabetes, family = binomial, data = dat)\nmcar_test(dat[, c("age", "bmi", "sbp", "hemoglobin")])  # Little's test (naniar)`}
        py={`import missingno as msno, statsmodels.formula.api as smf\nmsno.matrix(dat)                        # missingness map\ndat.isna().value_counts()               # pattern table\ndat.isna().mean().sort_values()\nsmf.logit("bmi_missing ~ age + C(site) + sex + diabetes", dat.assign(bmi_missing=dat.bmi.isna().astype(int))).fit()`}
      />
      <Takeaways
        items={[
          'Report the amount and pattern of missing data per variable, and the number of complete cases.',
          'Compare patients with and without missing values to find predictors of missingness.',
          'Associations refute MCAR and identify auxiliary variables; they cannot confirm MAR.',
          'Complete-case analysis silently discards every incomplete row, often far more than any single variable suggests.',
        ]}
      />
      <CheckYourself ids={['md-little']} />
    </div>
  );
}
