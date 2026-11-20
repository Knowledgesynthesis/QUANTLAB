import { useMemo, useState } from 'react';
import { rubinsRules } from '@/lib/stats';
import { Callout, Code, DataTable, Formula, SliderField, Stat } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { fmt, fmtP } from '@/lib/utils';

function RubinCalculator() {
  const [text, setText] = useState('0.42, 0.11\n0.47, 0.12\n0.39, 0.11\n0.51, 0.12\n0.44, 0.11');
  const [dfc, setDfc] = useState('296');
  const parsed = useMemo(() => {
    const rows = text.split(/\n+/).map((l) => l.split(/[,;\t ]+/).map(Number)).filter((r) => r.length >= 2 && r.every(Number.isFinite));
    return { est: rows.map((r) => r[0]), se: rows.map((r) => r[1]) };
  }, [text]);
  const df = Number(dfc);
  const res = parsed.est.length >= 2 ? rubinsRules(parsed.est, parsed.se.map((s) => s * s), Number.isFinite(df) && df > 0 ? df : Infinity) : null;
  return (
    <Lab title="Rubin's rules calculator" description="Paste one 'estimate, SE' pair per imputed dataset.">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor="rr-in" className="mb-1.5 block text-sm font-medium">Estimates and SEs (m = {parsed.est.length})</label>
          <textarea id="rr-in" value={text} onChange={(e) => setText(e.target.value)} rows={6} className="w-full rounded-lg border border-input bg-card p-2 font-mono text-sm" />
        </div>
        <div>
          <label htmlFor="rr-df" className="mb-1.5 block text-sm font-medium">Complete-data df (n − p)</label>
          <input id="rr-df" value={dfc} onChange={(e) => setDfc(e.target.value)} inputMode="numeric" className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm" />
          <p className="mt-1 text-xs text-muted-foreground">Leave blank for large samples. Used for the Barnard–Rubin small-sample df <Cite ids="barnard1999" />.</p>
        </div>
      </div>
      {res ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Pooled estimate" value={fmt(res.estimate, 3)} />
            <Stat label="Pooled SE" value={fmt(res.se, 3)} />
            <Stat label="95% CI" value={`${fmt(res.ciLow, 2)}, ${fmt(res.ciHigh, 2)}`} />
            <Stat label="p" value={fmtP(res.p)} />
          </div>
          <DataTable
            head={['Component', 'Value', 'Meaning']}
            align={['l', 'r', 'l']}
            rows={[
              ['Within-imputation variance Ū', fmt(res.withinVar, 5), 'Average sampling variance if the data were complete'],
              ['Between-imputation variance B', fmt(res.betweenVar, 5), 'Extra uncertainty because values are missing'],
              ['Total variance T = Ū + (1 + 1/m)B', fmt(res.totalVar, 5), 'Variance used for the CI'],
              ['Relative increase in variance', fmt(res.riv, 3), '(1 + 1/m)B / Ū'],
              ['Fraction of missing information', fmt(res.fmi, 3), 'Share of information lost to missingness'],
              ['Degrees of freedom', fmt(res.df, 1), res.df < 30 ? 'Small: more imputations or larger n help' : 'Adequate'],
            ]}
          />
        </>
      ) : (
        <p className="text-sm text-critical-text">Enter at least two lines of "estimate, SE".</p>
      )}
    </Lab>
  );
}

function HowManyImputations() {
  const [incomplete, setIncomplete] = useState(35);
  const [fmi, setFmi] = useState(0.3);
  const [cv, setCv] = useState(0.05);
  const vh = Math.ceil(1 + 0.5 * (fmi / cv) ** 2);
  return (
    <Lab title="How many imputations?">
      <div className="grid gap-5 sm:grid-cols-3">
        <SliderField label="% of cases with any missing value" value={incomplete} onChange={setIncomplete} min={1} max={90} format={(v) => `${v}%`} />
        <SliderField label="Fraction of missing information (pilot)" value={fmi} onChange={setFmi} min={0.05} max={0.8} step={0.05} format={(v) => v.toFixed(2)} />
        <SliderField label="Acceptable CV of the SE estimate" value={cv} onChange={setCv} min={0.01} max={0.2} step={0.01} format={(v) => v.toFixed(2)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="White–Royston–Wood rule" value={`m ≥ ${Math.max(5, incomplete)}`} sub="m ≥ % incomplete cases" />
        <Stat label="von Hippel quadratic rule" value={`m ≥ ${vh}`} sub="1 + ½(FMI / CV)²" />
      </div>
      <p className="text-sm text-muted-foreground">
        Five imputations (the old default) give stable point estimates, but standard errors and p-values can change noticeably when you rerun with another seed.
        Run a pilot with ~20 imputations to estimate the FMI, then set m <Cite ids="white2011,vonhippel2020" />.
      </p>
    </Lab>
  );
}

export default function MIPractice() {
  return (
    <div>
      <P>
        Multiple imputation (MI) replaces each missing value with m plausible draws from its predictive distribution given the observed data, analyses each completed
        dataset as usual, and pools the m results. Done properly, it is valid under MAR and propagates the uncertainty about the missing values <Cite ids="rubin1987,sterne2009" />.
        Done carelessly, it can be worse than complete-case analysis <Cite ids="hughes2019" />.
      </P>
      <h2 className="mt-6 mb-3 text-lg font-semibold">Specifying the imputation model</h2>
      <DataTable
        head={['Rule', 'Why']}
        rows={[
          ['Include the outcome', 'Otherwise imputed values are unrelated to it and associations are biased toward zero (simulator: "MI without the outcome").'],
          ['Include every analysis-model variable, in the same form', 'Congeniality: interactions, splines and transformations in the analysis model must be reflected in the imputation model.'],
          ['Add auxiliary variables', 'Variables that predict missingness or the missing values make MAR more plausible and estimates more precise.'],
          ['Use an appropriate model per variable', 'Predictive mean matching for skewed or bounded continuous variables; logistic for binary; multinomial or proportional-odds for categorical.'],
          ['Impute derived variables carefully', 'Impute BMI directly, or impute height and weight and derive BMI passively; never impute a variable and its derivation independently.'],
          ['Check convergence and plausibility', 'Trace plots across iterations; compare observed and imputed distributions.'],
          ['Pool with Rubin\'s rules', 'Pool estimates on an approximately normal scale (log odds, not odds ratios), then transform.'],
        ]}
      />
      <Callout kind="mistake" title="&quot;We imputed the missing values using mean imputation&quot;">
        Single imputation, with means, regression predictions or last observation carried forward, treats invented values as known and underestimates every standard error.
        The simulator showed this as below-nominal coverage.
      </Callout>
      <Formula note="Rubin's rules: pooled estimate and its total variance">Q̄ = (1/m) Σ Q̂ⱼ     T = Ū + (1 + 1/m) B,  with  Ū = (1/m) Σ Uⱼ,  B = Σ (Q̂ⱼ − Q̄)² / (m − 1)</Formula>
      <RubinCalculator />
      <HowManyImputations />

      <h2 className="mt-8 mb-3 text-lg font-semibold">Prediction models</h2>
      <P>
        For a prediction model, the imputation is part of the modelling pipeline: during internal validation it must be repeated inside each bootstrap or cross-validation
        fold, or performance is optimistic <Cite ids="wahl2016" />. Also decide how missing predictors will be handled when the model is used for a new patient; that strategy
        should match development.
      </P>
      <Code
        title="A complete MI workflow"
        r={`library(mice)\nini  <- mice(dat, maxit = 0)                       # inspect defaults\npred <- quickpred(dat, mincor = 0.1, include = "los_days")  # auxiliary selection, keep the outcome\nmeth <- ini$method; meth["bmi"] <- "pmm"\nimp  <- mice(dat, m = 40, maxit = 20, method = meth, predictorMatrix = pred, seed = 2025)\nplot(imp)                                          # convergence traces\ndensityplot(imp, ~ bmi)                            # observed vs imputed\nfit  <- with(imp, lm(log(los_days) ~ bmi + age + diabetes))\nsummary(pool(fit), conf.int = TRUE)                # Rubin's rules + Barnard–Rubin df`}
        py={`import statsmodels.api as sm\nfrom statsmodels.imputation.mice import MICEData, MICE\n\nimp = MICEData(dat[["los_days", "bmi", "age", "diabetes", "hemoglobin"]])\nimp.set_imputer("bmi", formula="los_days + age + diabetes + hemoglobin")  # outcome included\nmi = MICE("np.log(los_days) ~ bmi + age + diabetes", sm.OLS, imp)\nres = mi.fit(n_burnin=20, n_imputations=40)        # pooled with Rubin's rules\nprint(res.summary())`}
      />
      <Takeaways
        items={[
          'The imputation model includes the outcome, all analysis variables (in the same form) and auxiliary variables.',
          'Use predictive mean matching for skewed or bounded variables.',
          'm ≥ % incomplete cases is a sound default; refine with von Hippel\'s rule.',
          'For prediction models, imputation goes inside the validation loop.',
        ]}
      />
      <CheckYourself ids={['md-m', 'md-rubin']} />
    </div>
  );
}
